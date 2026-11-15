import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity.js';
import { ErrorCode } from '@online-school/shared-types';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { AdminLoginDto, ChangePasswordDto } from './dto/admin.dto.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const { username, password } = dto;

    const admin = await this.adminRepo.findOne({ where: { username } });
    if (!admin) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: '账号或密码错误',
      });
    }

    if (admin.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({
        code: ErrorCode.ADMIN_DISABLED,
        message: '管理员已被禁用',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: '账号或密码错误',
      });
    }

    // Update last login time
    admin.last_login_at = new Date();
    await this.adminRepo.save(admin);

    return this.generateTokens(admin);
  }

  async changePassword(adminId: number, dto: ChangePasswordDto) {
    const { old_password, new_password } = dto;

    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new BadRequestException({
        code: ErrorCode.ADMIN_NOT_FOUND,
        message: '管理员不存在',
      });
    }

    const isValid = await bcrypt.compare(old_password, admin.password_hash);
    if (!isValid) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: '旧密码不正确',
      });
    }

    admin.password_hash = await bcrypt.hash(new_password, 10);
    await this.adminRepo.save(admin);

    return { message: '密码修改成功' };
  }

  async refreshToken(refresh_token: string) {
    try {
      const secret = this.configService.get<string>('jwt.secret') as string;
      const payload = this.jwtService.verify(refresh_token, { secret });

      if (payload.type !== 'refresh' || payload.role !== 'admin') {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Token 类型错误',
        });
      }

      const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
      if (!admin || admin.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException({
          code: ErrorCode.ADMIN_NOT_FOUND,
          message: '管理员不存在或已被禁用',
        });
      }

      return this.generateTokens(admin);
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Refresh token 已过期',
      });
    }
  }

  private generateTokens(admin: Admin) {
    const payload = { sub: admin.id, username: admin.username, role: 'admin' };
    const secret = this.configService.get<string>('jwt.secret') as string;

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn') || '2h',
    } as any);

    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret,
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
      } as any,
    );

    return {
      access_token,
      refresh_token,
      admin: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
      },
    };
  }
}
