import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Student } from '../student/entities/student.entity.js';
import { ErrorCode } from '@online-school/shared-types';
import { UpdateProfileDto } from './dto/user.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      });
    }

    const studentProfile = await this.studentRepo.findOne({ where: { user_id: userId } });

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      is_email_verified: user.is_email_verified,
      is_profile_completed: user.is_profile_completed,
      status: user.status,
      created_at: user.created_at,
      student_profile: studentProfile
        ? {
            grade: studentProfile.grade,
            major: studentProfile.major,
            university: studentProfile.university,
          }
        : null,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      });
    }

    // 昵称（可选）：传了就更新
    if (dto.nickname !== undefined) {
      const nickname = dto.nickname.trim();
      if (!nickname) {
        throw new BadRequestException({
          code: ErrorCode.PARAM_ERROR,
          message: '昵称不能为空',
        });
      }
      user.nickname = nickname;
    }

    // Upsert student profile
    let student = await this.studentRepo.findOne({ where: { user_id: userId } });
    if (student) {
      student.grade = dto.grade;
      student.major = dto.major;
      student.university = dto.university;
    } else {
      student = this.studentRepo.create({
        user_id: userId,
        grade: dto.grade,
        major: dto.major,
        university: dto.university,
      });
    }
    await this.studentRepo.save(student);

    // Mark profile as completed
    user.is_profile_completed = true;
    await this.userRepo.save(user);

    return { message: '个人信息更新成功' };
  }

  /** 更新头像地址（上传落盘后调用） */
  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      });
    }
    user.avatar_url = avatarUrl;
    await this.userRepo.save(user);
    return { avatar_url: avatarUrl };
  }
}
