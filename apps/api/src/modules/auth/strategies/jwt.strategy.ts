import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { Admin } from '../../admin/entities/admin.entity.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: any) {
    // Admin token
    if (payload.role === 'admin') {
      const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
      if (!admin) {
        throw new UnauthorizedException('管理员不存在');
      }
      if (admin.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException('管理员已被禁用');
      }
      return { id: admin.id, role: 'admin', username: admin.username };
    }

    // Regular user token
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('账户已被禁用');
    }
    return { id: user.id, role: 'user', email: user.email };
  }
}
