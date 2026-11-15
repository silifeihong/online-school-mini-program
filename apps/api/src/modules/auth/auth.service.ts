import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity.js';
import { EmailCode } from './entities/email-code.entity.js';
import { ErrorCode } from '@online-school/shared-types';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import {
  SendEmailCodeDto,
  RegisterDto,
  LoginDto,
  WechatLoginDto,
  WechatBindEmailDto,
  SendWechatBindCodeDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EmailCode)
    private readonly emailCodeRepo: Repository<EmailCode>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== Email Code ====================

  async sendEmailCode(dto: SendEmailCodeDto) {
    const { email } = dto;

    // Check if email already registered
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_EXISTS,
        message: '该邮箱已注册',
      });
    }

    // Check rate limit (60 seconds)
    const recentCode = await this.emailCodeRepo.findOne({
      where: { email, created_at: MoreThan(new Date(Date.now() - 60 * 1000)) },
      order: { created_at: 'DESC' },
    });
    if (recentCode) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_CODE_TOO_FREQUENT,
        message: '验证码发送过于频繁，请60秒后重试',
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to database
    await this.emailCodeRepo.save({
      email,
      code,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send email (mock in development)
    const provider = this.configService.get<string>('email.provider');
    if (provider === 'mock') {
      this.logger.log(`[MOCK] Email code for ${email}: ${code}`, 'AuthService');
    } else {
      // TODO: Implement Aliyun email sending
      this.logger.log(`Sending email code to ${email}`, 'AuthService');
    }

    return { message: '验证码已发送' };
  }

  // ==================== Register ====================

  async register(dto: RegisterDto) {
    const { email, code, password, nickname } = dto;

    // Verify email code
    await this.verifyCode(email, code);

    // Check if email already registered
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_EXISTS,
        message: '该邮箱已注册',
      });
    }

    // Create user（注册不再自动关联微信，关联需走微信一键登录 → 绑定邮箱流程）
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password_hash: passwordHash,
      nickname: nickname || email.split('@')[0], // 默认用邮箱前缀作为昵称
      wx_openid: null,
      is_email_verified: true,
      is_profile_completed: false,
      status: UserStatus.ACTIVE,
    });
    await this.userRepo.save(user);

    // Generate tokens
    return this.generateTokens(user);
  }

  // ==================== Login ====================

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: '账号或密码错误',
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_DISABLED,
        message: '账户已被禁用',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: '账号或密码错误',
      });
    }

    return this.generateTokens(user);
  }

  // ==================== WeChat Login ====================

  async wechatLogin(dto: WechatLoginDto) {
    const { wx_code } = dto;
    const openid = await this.getWechatOpenid(wx_code);

    if (!openid) {
      throw new UnauthorizedException({
        code: ErrorCode.PARAM_ERROR,
        message: '微信登录失败',
      });
    }

    const user = await this.userRepo.findOne({ where: { wx_openid: openid } });

    if (user) {
      // Existing user
      if (user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_DISABLED,
          message: '账户已被禁用',
        });
      }
      return {
        needBindEmail: false,
        ...this.generateTokens(user),
      };
    }

    // New user, need to bind email
    return {
      needBindEmail: true,
      wx_openid: openid,
    };
  }

  // ==================== WeChat Bind Email ====================

  /**
   * 微信绑定邮箱-发送验证码
   * 已注册且已关联微信 → 报错；已注册未关联 → 返回 registered:true（前端隐藏密码框走关联）；未注册 → registered:false（走新建）
   */
  async sendWechatBindCode(dto: SendWechatBindCodeDto) {
    const { email } = dto;

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser?.wx_openid) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_EXISTS,
        message: '该邮箱已关联微信',
      });
    }

    // Check rate limit (60 seconds)
    const recentCode = await this.emailCodeRepo.findOne({
      where: { email, created_at: MoreThan(new Date(Date.now() - 60 * 1000)) },
      order: { created_at: 'DESC' },
    });
    if (recentCode) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_CODE_TOO_FREQUENT,
        message: '验证码发送过于频繁，请60秒后重试',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.emailCodeRepo.save({
      email,
      code,
      expires_at: expiresAt,
      is_used: false,
    });

    const provider = this.configService.get<string>('email.provider');
    if (provider === 'mock') {
      this.logger.log(`[MOCK] Bind email code for ${email}: ${code}`, 'AuthService');
    }

    return { message: '验证码已发送', registered: !!existingUser };
  }

  async wechatBindEmail(dto: WechatBindEmailDto) {
    const { wx_openid, email, code, password, nickname } = dto;

    // openid 由 wechat-login 在服务端换取后下发，此处直接使用（wx code 一次性，不可二次换取）
    // Check if openid already bound
    const boundUser = await this.userRepo.findOne({ where: { wx_openid } });
    if (boundUser) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '该微信已绑定其他账户',
      });
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });

    if (existingUser) {
      // 关联模式：邮箱已注册但未关联微信，验证验证码后把 openid 挂到已有账号并登录
      if (existingUser.wx_openid) {
        throw new BadRequestException({
          code: ErrorCode.EMAIL_EXISTS,
          message: '该邮箱已关联微信',
        });
      }
      if (existingUser.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_DISABLED,
          message: '账户已被禁用',
        });
      }

      await this.verifyCode(email, code);

      existingUser.wx_openid = wx_openid;
      await this.userRepo.save(existingUser);

      return this.generateTokens(existingUser);
    }

    // 新建模式：邮箱未注册，验证验证码后创建账号
    await this.verifyCode(email, code);

    if (!password) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '请设置密码',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      email,
      password_hash: passwordHash,
      nickname: nickname?.trim() || email.split('@')[0],
      wx_openid,
      is_email_verified: true,
      is_profile_completed: false,
      status: UserStatus.ACTIVE,
    });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  // ==================== Forgot/Reset Password ====================

  /**
   * 检查邮箱是否已注册（忘记密码-确认账号页分流用）
   */
  async checkEmail(dto: { email: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    return { registered: !!user };
  }

  async forgotPassword(dto: { email: string }) {
    const { email } = dto;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException({
        code: ErrorCode.USER_NOT_FOUND,
        message: '该邮箱未注册',
      });
    }

    // Reuse sendEmailCode logic (without the "already registered" check)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.emailCodeRepo.save({
      email,
      code,
      expires_at: expiresAt,
      is_used: false,
    });

    const provider = this.configService.get<string>('email.provider');
    if (provider === 'mock') {
      this.logger.log(`[MOCK] Reset password code for ${email}: ${code}`, 'AuthService');
    }

    return { message: '验证码已发送' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, new_password } = dto;

    // Verify code
    await this.verifyCode(email, code);

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException({
        code: ErrorCode.USER_NOT_FOUND,
        message: '用户不存在',
      });
    }

    user.password_hash = await bcrypt.hash(new_password, 10);
    await this.userRepo.save(user);

    return { message: '密码重置成功' };
  }

  // ==================== Token Refresh ====================

  async refreshToken(dto: RefreshTokenDto) {
    const { refresh_token } = dto;

    try {
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('jwt.secret') as string,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Token 类型错误',
        });
      }

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_NOT_FOUND,
          message: '用户不存在或已被禁用',
        });
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Refresh token 已过期，请重新登录',
      });
    }
  }

  // ==================== Helpers ====================

  private async verifyCode(email: string, code: string) {
    const record = await this.emailCodeRepo.findOne({
      where: { email, code, is_used: false },
      order: { created_at: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_CODE_INVALID,
        message: '验证码不正确',
      });
    }

    if (new Date() > record.expires_at) {
      throw new BadRequestException({
        code: ErrorCode.EMAIL_CODE_EXPIRED,
        message: '验证码已过期',
      });
    }

    // Mark as used
    record.is_used = true;
    await this.emailCodeRepo.save(record);
  }

  private async getWechatOpenid(code: string): Promise<string | null> {
    if (!code) return null;

    const appid = this.configService.get<string>('wechat.appid');
    const secret = this.configService.get<string>('wechat.secret');

    // 未配置真实微信凭据时回退为 mock openid（仅开发环境；code 每次不同，mock 无法跨请求关联）
    if (!appid || !secret || appid === 'your-appid' || secret === 'your-secret') {
      this.logger.warn('WECHAT_APPID/WECHAT_SECRET 未配置，使用 mock openid（仅开发环境）');
      return `mock_openid_${code}`;
    }

    try {
      const url =
        'https://api.weixin.qq.com/sns/jscode2session' +
        `?appid=${encodeURIComponent(appid)}` +
        `&secret=${encodeURIComponent(secret)}` +
        `&js_code=${encodeURIComponent(code)}` +
        '&grant_type=authorization_code';
      const response = await fetch(url);
      const data = (await response.json()) as {
        openid?: string;
        session_key?: string;
        errcode?: number;
        errmsg?: string;
      };

      if (data.openid) {
        return data.openid;
      }

      this.logger.error(`WeChat code2session failed: ${data.errcode} ${data.errmsg}`);
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: `微信登录失败：${data.errmsg || '未知错误'}`,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('WeChat code2session request error:', error as Error);
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '微信登录失败，请稍后重试',
      });
    }
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const secret = this.configService.get<string>('jwt.secret') as string;
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') || '2h';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: accessExpiresIn as any,
    } as any);

    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret,
        expiresIn: refreshExpiresIn as any,
      } as any,
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        is_email_verified: user.is_email_verified,
        is_profile_completed: user.is_profile_completed,
      },
    };
  }
}
