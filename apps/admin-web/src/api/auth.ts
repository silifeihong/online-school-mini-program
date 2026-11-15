import request from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  admin: {
    id: number;
    username: string;
    real_name: string;
  };
}

export interface ChangePasswordParams {
  old_password: string;
  new_password: string;
}

/**
 * 管理员登录
 */
export function login(params: LoginParams): Promise<LoginResponse> {
  return request.post('/admin/login', params);
}

/**
 * 刷新 Token
 */
export function refreshToken(refresh_token: string): Promise<LoginResponse> {
  return request.post('/admin/refresh-token', { refresh_token });
}

/**
 * 修改密码
 */
export function changePassword(params: ChangePasswordParams): Promise<void> {
  return request.put('/admin/password', params);
}
