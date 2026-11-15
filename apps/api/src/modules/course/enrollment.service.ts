import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ErrorCode } from '@online-school/shared-types';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { Course } from './entities/course.entity.js';
import { CourseEnrollment } from './entities/course-enrollment.entity.js';
import { User } from '../user/entities/user.entity.js';
import { Student } from '../student/entities/student.entity.js';
import {
  BatchAddStudentsDto,
  QueryCandidateStudentsDto,
  QueryEnrolledStudentsDto,
} from './dto/enrollment.dto.js';

/** OpenID 掩码：前 7 位 + … + 后 5 位 */
export function maskOpenid(openid: string | null): string {
  if (!openid) return '';
  if (openid.length <= 12) return openid;
  return `${openid.slice(0, 7)}…${openid.slice(-5)}`;
}

function paginate(page: number, limit: number, total: number) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) };
}

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(CourseEnrollment)
    private readonly enrollRepo: Repository<CourseEnrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  private async ensureCourse(courseId: number): Promise<Course> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException({ code: ErrorCode.COURSE_NOT_FOUND, message: '课程不存在' });
    }
    return course;
  }

  /** 课程学员列表（已加入） */
  async findStudents(courseId: number, dto: QueryEnrolledStudentsDto) {
    await this.ensureCourse(courseId);

    const base = () => {
      const qb = this.enrollRepo
        .createQueryBuilder('e')
        .innerJoin(User, 'u', 'u.id = e.user_id')
        .where('e.course_id = :courseId', { courseId });
      if (dto.keyword) {
        qb.andWhere('(u.nickname LIKE :kw OR u.wx_openid LIKE :kw)', { kw: `%${dto.keyword}%` });
      }
      return qb;
    };

    const total = await base().getCount();
    const rows = await base()
      .select([
        'e.id AS enrollment_id',
        'e.user_id AS user_id',
        'u.nickname AS nickname',
        'u.email AS email',
        'u.wx_openid AS wx_openid',
        's.grade AS grade',
        's.major AS major',
        's.university AS university',
        'e.created_at AS joined_at',
      ])
      .leftJoin(Student, 's', 's.user_id = u.id')
      .orderBy('e.created_at', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .offset((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .getRawMany();

    const list = rows.map((r) => ({
      enrollment_id: Number(r.enrollment_id),
      user_id: Number(r.user_id),
      openid_masked: maskOpenid(r.wx_openid),
      nickname: r.nickname ?? '',
      email: r.email ?? '',
      grade: r.grade ?? null,
      major: r.major ?? null,
      university: r.university ?? null,
      joined_at: r.joined_at,
    }));
    return { list, pagination: paginate(dto.page, dto.limit, total) };
  }

  /** 添加学员候选列表：全部正常状态学员，已加入的标记 enrolled=true（置灰而非排除） */
  async findCandidates(courseId: number, dto: QueryCandidateStudentsDto) {
    await this.ensureCourse(courseId);

    const base = () => {
      const qb = this.studentRepo
        .createQueryBuilder('s')
        .innerJoin(User, 'u', 'u.id = s.user_id')
        .leftJoin(CourseEnrollment, 'e', 'e.user_id = s.user_id AND e.course_id = :courseId', {
          courseId,
        })
        .where('u.status = :active', { active: UserStatus.ACTIVE });
      if (dto.keyword) {
        qb.andWhere('(u.nickname LIKE :kw OR u.wx_openid LIKE :kw)', { kw: `%${dto.keyword}%` });
      }
      if (dto.email) {
        qb.andWhere('u.email LIKE :email', { email: `%${dto.email}%` });
      }
      if (dto.grade) qb.andWhere('s.grade = :grade', { grade: dto.grade });
      if (dto.major) qb.andWhere('s.major = :major', { major: dto.major });
      if (dto.university) qb.andWhere('s.university = :university', { university: dto.university });
      return qb;
    };

    const total = await base().getCount();
    const rows = await base()
      .select([
        's.user_id AS user_id',
        'u.nickname AS nickname',
        'u.email AS email',
        'u.wx_openid AS wx_openid',
        's.grade AS grade',
        's.major AS major',
        's.university AS university',
        'e.id AS enrollment_id',
      ])
      .orderBy('s.user_id', 'ASC')
      .offset((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .getRawMany();

    const list = rows.map((r) => ({
      user_id: Number(r.user_id),
      openid_masked: maskOpenid(r.wx_openid),
      nickname: r.nickname ?? '',
      email: r.email ?? '',
      grade: r.grade ?? null,
      major: r.major ?? null,
      university: r.university ?? null,
      enrolled: r.enrollment_id !== null && r.enrollment_id !== undefined,
    }));
    return { list, pagination: paginate(dto.page, dto.limit, total) };
  }

  /** 批量添加学员；任一目标已在课程中则整体拒绝（16005） */
  async batchAdd(courseId: number, dto: BatchAddStudentsDto) {
    await this.ensureCourse(courseId);
    const userIds = [...new Set(dto.user_ids)];

    const users = await this.userRepo.find({
      where: { id: In(userIds), status: UserStatus.ACTIVE },
    });
    if (users.length !== userIds.length) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '包含无效或已停用的学员',
      });
    }

    const existing = await this.enrollRepo.find({
      where: { course_id: courseId, user_id: In(userIds) },
    });
    if (existing.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.ENROLLMENT_EXISTS,
        message: '所选学员中存在已加入该课程的学员',
      });
    }

    const enrollments = userIds.map((userId) =>
      this.enrollRepo.create({ course_id: courseId, user_id: userId }),
    );
    await this.enrollRepo.save(enrollments);
    return { added: userIds.length };
  }

  /** 移出学员（硬删除关系） */
  async removeStudent(courseId: number, userId: number): Promise<null> {
    await this.ensureCourse(courseId);
    const result = await this.enrollRepo.delete({ course_id: courseId, user_id: userId });
    if (!result.affected) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '该学员不在课程中',
      });
    }
    return null;
  }
}
