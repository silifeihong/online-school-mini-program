import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '@online-school/shared-types';
import { CourseStatus, PaymentType } from '../../common/enums/content.enums.js';
import { Course } from './entities/course.entity.js';
import { Chapter } from './entities/chapter.entity.js';
import { CourseEnrollment } from './entities/course-enrollment.entity.js';
import {
  AdminQueryCoursesDto,
  CreateChapterDto,
  CreateCourseDto,
  SortChaptersDto,
  UpdateChapterDto,
  UpdateCourseDto,
} from './dto/course.dto.js';

@Injectable()
export class AdminCourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(dto: AdminQueryCoursesDto) {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .loadRelationCountAndMap('course.chapter_count', 'course.chapters')
      .loadRelationCountAndMap('course.student_count', 'course.enrollments');

    if (dto.keyword) {
      qb.andWhere('course.title LIKE :kw', { kw: `%${dto.keyword}%` });
    }
    if (dto.payment_type) {
      qb.andWhere('course.payment_type = :pt', { pt: dto.payment_type });
    }
    if (dto.status) {
      qb.andWhere('course.status = :st', { st: dto.status });
    }

    qb.orderBy('course.updated_at', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [list, total] = await qb.getManyAndCount();
    return {
      list,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        total_pages: Math.ceil(total / dto.limit),
      },
    };
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException({ code: ErrorCode.COURSE_NOT_FOUND, message: '课程不存在' });
    }
    return course;
  }

  /** 课程详情 + 章节（编辑向导回显） */
  async findDetail(id: number) {
    const course = await this.findOne(id);
    const chapters = await this.chapterRepo.find({
      where: { course_id: id },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    return { ...course, chapters };
  }

  async create(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepo.create({
      ...dto,
      // 免费课程价格强制 0
      price: dto.payment_type === PaymentType.FREE ? 0 : dto.price,
    });
    return this.courseRepo.save(course);
  }

  async update(id: number, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    const paymentType = dto.payment_type ?? course.payment_type;
    if (paymentType === PaymentType.FREE) {
      course.price = 0;
    }
    return this.courseRepo.save(course);
  }

  /** 仅草稿、或无学员的已下架课程可删除（与列表页删除按钮的展示条件一致） */
  async remove(id: number): Promise<null> {
    const course = await this.findOne(id);
    const studentCount = await this.dataSource
      .getRepository(CourseEnrollment)
      .count({ where: { course_id: id } });
    const deletable =
      course.status === CourseStatus.DRAFT ||
      (course.status === CourseStatus.OFF && studentCount === 0);
    if (!deletable) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message:
          course.status === CourseStatus.ON
            ? '已上架课程不能删除，请先下架'
            : '已有学员的课程不能删除',
      });
    }
    // 章节/学员关系随 FK CASCADE 删除
    await this.courseRepo.remove(course);
    return null;
  }

  async updateStatus(id: number, status: CourseStatus): Promise<Course> {
    // 草稿仅为创建后的初始状态，不允许通过状态接口回退
    if (status === CourseStatus.DRAFT) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '不能将状态设置为草稿',
      });
    }
    const course = await this.findOne(id);
    course.status = status;
    return this.courseRepo.save(course);
  }

  /** 发布 = 必填校验 + status=on */
  async publish(id: number): Promise<Course> {
    const course = await this.findOne(id);
    if (!course.cover_url) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '请先上传课程封面再发布',
      });
    }
    const chapterCount = await this.chapterRepo.count({ where: { course_id: id } });
    if (chapterCount === 0) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '请至少添加一个章节再发布',
      });
    }
    course.status = CourseStatus.ON;
    return this.courseRepo.save(course);
  }

  // ---------- 章节 ----------

  async listChapters(courseId: number): Promise<Chapter[]> {
    await this.findOne(courseId);
    return this.chapterRepo.find({
      where: { course_id: courseId },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
  }

  async addChapter(courseId: number, dto: CreateChapterDto): Promise<Chapter> {
    await this.findOne(courseId);
    if (dto.sort_order === undefined) {
      const max = await this.chapterRepo
        .createQueryBuilder('ch')
        .select('COALESCE(MAX(ch.sort_order), 0)', 'max')
        .where('ch.course_id = :courseId', { courseId })
        .getRawOne<{ max: string }>();
      dto.sort_order = Number(max?.max ?? 0) + 1;
    }
    const chapter = this.chapterRepo.create({ ...dto, course_id: courseId });
    return this.chapterRepo.save(chapter);
  }

  private async findChapter(courseId: number, chapterId: number): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId, course_id: courseId },
    });
    if (!chapter) {
      throw new NotFoundException({ code: ErrorCode.CHAPTER_NOT_FOUND, message: '章节不存在' });
    }
    return chapter;
  }

  async updateChapter(
    courseId: number,
    chapterId: number,
    dto: UpdateChapterDto,
  ): Promise<Chapter> {
    const chapter = await this.findChapter(courseId, chapterId);
    Object.assign(chapter, dto);
    return this.chapterRepo.save(chapter);
  }

  async removeChapter(courseId: number, chapterId: number): Promise<null> {
    const chapter = await this.findChapter(courseId, chapterId);
    await this.chapterRepo.remove(chapter);
    return null;
  }

  /** 按给定 id 顺序重排全部章节（ids 必须是该课程章节的全集） */
  async sortChapters(courseId: number, dto: SortChaptersDto): Promise<null> {
    await this.findOne(courseId);
    const chapters = await this.chapterRepo.find({ where: { course_id: courseId } });
    const existingIds = new Set(chapters.map((c) => c.id));
    const sameSet =
      dto.ids.length === existingIds.size && dto.ids.every((id) => existingIds.has(id));
    if (!sameSet) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '章节排序列表与课程现有章节不一致',
      });
    }
    await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < dto.ids.length; i++) {
        await manager.update(Chapter, { id: dto.ids[i], course_id: courseId }, { sort_order: i + 1 });
      }
    });
    return null;
  }
}
