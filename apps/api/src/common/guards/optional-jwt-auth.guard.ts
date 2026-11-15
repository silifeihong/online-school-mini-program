import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选登录守卫：带合法 Bearer 时注入 request.user，
 * 未登录/凭证无效不抛 401，由业务层决定是否放行（游客可浏览课程列表/详情）。
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: TUser): TUser {
    return user || (null as unknown as TUser);
  }
}
