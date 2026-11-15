import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity.js';
import { ErrorCode } from '@online-school/shared-types';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '需要管理员权限',
      });
    }

    return true;
  }
}
