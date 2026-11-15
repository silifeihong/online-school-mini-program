import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Student } from './entities/student.entity.js';
import { User } from '../user/entities/user.entity.js';
import { ErrorCode } from '@online-school/shared-types';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { FindAllStudentsDto, UpdateStudentStatusDto, ResetPasswordDto } from './dto/student.dto.js';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(dto: FindAllStudentsDto) {
    const { keyword, status, grade, major, university, page = 1, limit = 20 } = dto;

    const qb = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .select([
        'student.id',
        'student.grade',
        'student.major',
        'student.university',
        'student.created_at',
        'student.updated_at',
        'user.id',
        'user.email',
        'user.nickname',
        'user.avatar_url',
        'user.wx_openid',
        'user.status',
        'user.is_email_verified',
        'user.is_profile_completed',
        'user.created_at',
      ]);

    if (keyword) {
      qb.andWhere('(user.email LIKE :keyword OR user.nickname LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    if (grade) {
      qb.andWhere('student.grade = :grade', { grade });
    }

    if (major) {
      qb.andWhere('student.major = :major', { major });
    }

    if (university) {
      qb.andWhere('student.university = :university', { university });
    }

    qb.orderBy('student.created_at', 'DESC');

    const total = await qb.getCount();
    const students = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      list: students.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        email: s.user?.email,
        nickname: s.user?.nickname,
        avatar_url: s.user?.avatar_url,
        wx_openid: s.user?.wx_openid ?? null,
        status: s.user?.status,
        is_email_verified: s.user?.is_email_verified,
        is_profile_completed: s.user?.is_profile_completed,
        grade: s.grade,
        major: s.major,
        university: s.university,
        created_at: s.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 列表筛选下拉选项：年级/专业/院校/状态 取数据表对应字段去重值
   */
  async getFilterOptions() {
    const distinctStudentField = async (field: 'grade' | 'major' | 'university') => {
      const rows = await this.studentRepo
        .createQueryBuilder('student')
        .select(`student.${field}`, 'value')
        .where(`student.${field} IS NOT NULL`)
        .andWhere(`student.${field} != ''`)
        .distinct(true)
        .orderBy(`student.${field}`, 'ASC')
        .getRawMany<{ value: string }>();
      return rows.map((r) => r.value);
    };

    const statusRows = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoin('student.user', 'user')
      .select('user.status', 'value')
      .distinct(true)
      .orderBy('user.status', 'ASC')
      .getRawMany<{ value: string }>();

    const [grade, major, university] = await Promise.all([
      distinctStudentField('grade'),
      distinctStudentField('major'),
      distinctStudentField('university'),
    ]);

    return {
      grade,
      major,
      university,
      status: statusRows.map((r) => r.value),
    };
  }

  async findOne(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException({
        code: ErrorCode.STUDENT_NOT_FOUND,
        message: '学员不存在',
      });
    }

    return {
      id: student.id,
      user_id: student.user_id,
      email: student.user?.email,
      nickname: student.user?.nickname,
      avatar_url: student.user?.avatar_url,
      wx_openid: student.user?.wx_openid ?? null,
      status: student.user?.status,
      is_email_verified: student.user?.is_email_verified,
      is_profile_completed: student.user?.is_profile_completed,
      grade: student.grade,
      major: student.major,
      university: student.university,
      created_at: student.created_at,
      updated_at: student.updated_at,
    };
  }

  async updateStatus(id: number, dto: UpdateStudentStatusDto) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException({
        code: ErrorCode.STUDENT_NOT_FOUND,
        message: '学员不存在',
      });
    }

    student.user.status = dto.status;
    await this.userRepo.save(student.user);

    return { message: '状态更新成功' };
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException({
        code: ErrorCode.STUDENT_NOT_FOUND,
        message: '学员不存在',
      });
    }

    student.user.password_hash = await bcrypt.hash(dto.password, 10);
    await this.userRepo.save(student.user);

    return { message: '密码重置成功' };
  }
}
