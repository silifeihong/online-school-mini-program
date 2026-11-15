import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '@online-school/shared-types';
import { CourseStatus, PaymentType } from '../../common/enums/content.enums.js';
import { Course } from './entities/course.entity.js';
import { Chapter } from './entities/chapter.entity.js';
import { CourseEnrollment } from './entities/course-enrollment.entity.js';
import { Material } from '../material/entities/material.entity.js';
import { SettingsService, SETTING_KEY_SALES_WECHAT } from '../settings/settings.service.js';
import { OssService } from '../upload/oss.service.js';

export interface RequestUser {
  id: number;
  role: 'admin' | 'user';
}

export interface MiniFeedQuery {
  keyword?: string;
  type?: 'course' | 'material' | 'all';
  page: number;
  limit: number;
}

const PLAY_URL_EXPIRES_IN = 3600;

@Injectable()
export class MiniCourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollRepo: Repository<CourseEnrollment>,
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    private readonly settingsService: SettingsService,
    private readonly ossService: OssService,
  ) {}

  /** 首页列表：全部=课程+资料混排（按创建时间倒序，内存合并分页，Phase 2 数据量可接受） */
  async findFeed(query: MiniFeedQuery) {
    const type = query.type ?? 'all';
    const items: Array<{ kind: 'course' | 'material'; data: any }> = [];

    if (type === 'course' || type === 'all') {
      const qb = this.courseRepo
        .createQueryBuilder('course')
        .loadRelationCountAndMap('course.chapter_count', 'course.chapters')
        .loadRelationCountAndMap('course.student_count', 'course.enrollments')
        .where('course.status = :on', { on: CourseStatus.ON });
      if (query.keyword) {
        qb.andWhere('course.title LIKE :kw', { kw: `%${query.keyword}%` });
      }
      const courses = await qb.orderBy('course.created_at', 'DESC').getMany();
      for (const c of courses) {
        // 剔除未加载的关系属性，保留 chapter_count/student_count 统计
        const { chapters, enrollments, ...rest } = c as any;
        items.push({ kind: 'course', data: rest });
      }
    }

    if (type === 'material' || type === 'all') {
      const qb = this.materialRepo
        .createQueryBuilder('m')
        .where('m.status = :on', { on: CourseStatus.ON });
      if (query.keyword) {
        qb.andWhere('m.title LIKE :kw', { kw: `%${query.keyword}%` });
      }
      const materials = await qb.orderBy('m.created_at', 'DESC').getMany();
      for (const m of materials) {
        items.push({ kind: 'material', data: m });
      }
    }

    if (type === 'all') {
      items.sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime(),
      );
    }

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const list = items.slice(start, start + query.limit);
    return {
      list,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    };
  }

  /** 我的课程：当前用户已加入的课程列表（含已下架，按加入时间倒序） */
  async findMyCourses(userId: number) {
    const enrollments = await this.enrollRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    if (enrollments.length === 0) return [];

    const courses = await this.courseRepo
      .createQueryBuilder('course')
      .loadRelationCountAndMap('course.chapter_count', 'course.chapters')
      .whereInIds(enrollments.map((e) => e.course_id))
      .getMany();

    // 按加入时间倒序排列
    const order = new Map(enrollments.map((e, i) => [e.course_id, i]));
    courses.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return courses.map((c) => {
      // 剔除未加载的关系属性，保留 chapter_count 统计
      const { chapters, enrollments: _enrollments, ...rest } = c as any;
      return rest;
    });
  }

  /** 课程详情：目录带三态 state；下架课程仅已购学员可见 */
  async getDetail(id: number, user: RequestUser | null) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException({ code: ErrorCode.COURSE_NOT_FOUND, message: '课程不存在' });
    }

    const isUser = user?.role === 'user';
    const enrolled = isUser
      ? Boolean(
          await this.enrollRepo.findOne({
            where: { course_id: id, user_id: user!.id },
          }),
        )
      : false;

    // 非上架（草稿/下架）课程仅已购学员可见
    if (course.status !== CourseStatus.ON && !enrolled) {
      throw new NotFoundException({ code: ErrorCode.COURSE_OFF_SHELF, message: '课程已下架' });
    }

    const chapters = await this.chapterRepo.find({
      where: { course_id: id },
      order: { sort_order: 'ASC', id: 'ASC' },
    });

    const isFree = course.payment_type === PaymentType.FREE;
    const chapterList = chapters.map((ch) => {
      let state: 'trial' | 'unlocked' | 'locked';
      if (enrolled) {
        state = 'unlocked';
      } else if (ch.is_trial && course.status === CourseStatus.ON) {
        state = 'trial';
      } else if (isFree && isUser) {
        state = 'unlocked';
      } else {
        state = 'locked';
      }
      // 小程序端不下发文件地址，播放/下载一律走 play-url 签发
      return {
        id: ch.id,
        course_id: ch.course_id,
        title: ch.title,
        description: ch.description,
        content_type: ch.content_type,
        file_url: null,
        is_trial: ch.is_trial,
        sort_order: ch.sort_order,
        state,
      };
    });

    const result: Record<string, unknown> = {
      ...course,
      chapter_count: chapters.length,
      chapters: chapterList,
      enrolled,
    };
    // 付费未购时下发销售微信号供购买弹窗展示
    if (!isFree && !enrolled) {
      result.sales_wechat = await this.settingsService.get(SETTING_KEY_SALES_WECHAT);
    }
    return result;
  }

  /** 章节播放/文档地址：试看公开、免费课登录可看、付费课已购可看；OSS 文件返回限时签名 URL */
  async getPlayUrl(courseId: number, chapterId: number, user: RequestUser | null) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException({ code: ErrorCode.COURSE_NOT_FOUND, message: '课程不存在' });
    }
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId, course_id: courseId },
    });
    if (!chapter) {
      throw new NotFoundException({ code: ErrorCode.CHAPTER_NOT_FOUND, message: '章节不存在' });
    }
    if (!chapter.file_url) {
      throw new NotFoundException({
        code: ErrorCode.CHAPTER_NOT_FOUND,
        message: '该章节暂无可播放内容',
      });
    }

    const isUser = user?.role === 'user';
    const enrolled = isUser
      ? Boolean(
          await this.enrollRepo.findOne({
            where: { course_id: courseId, user_id: user!.id },
          }),
        )
      : false;

    // 非上架（草稿/下架）课程：仅已购学员可继续学习
    if (course.status !== CourseStatus.ON && !enrolled) {
      throw new NotFoundException({ code: ErrorCode.COURSE_OFF_SHELF, message: '课程已下架' });
    }

    if (!enrolled) {
      if (chapter.is_trial) {
        // 试看章节：任何访客可播放
      } else if (course.payment_type === PaymentType.FREE) {
        if (!isUser) {
          throw new UnauthorizedException({
            code: ErrorCode.UNAUTHORIZED,
            message: '请先登录后学习',
          });
        }
      } else {
        if (!isUser) {
          throw new UnauthorizedException({
            code: ErrorCode.UNAUTHORIZED,
            message: '请先登录后购买',
          });
        }
        throw new NotFoundException({
          code: ErrorCode.COURSE_NOT_PURCHASED,
          message: '尚未购买该课程',
        });
      }
    }

    return {
      url: this.ossService.signGetUrl(chapter.file_url, PLAY_URL_EXPIRES_IN),
      expires_in: PLAY_URL_EXPIRES_IN,
    };
  }
}
