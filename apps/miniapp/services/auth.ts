import { http } from '../utils/request';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  code: string;
}

export interface WechatLoginParams {
  code: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    is_profile_completed: boolean;
  };
}

/**
 * 发送邮箱验证码
 */
export function sendEmailCode(email: string) {
  return http.post('/auth/send-email-code', { email });
}

/**
 * 邮箱注册
 */
export function register(params: RegisterParams) {
  return http.post<LoginResponse>('/auth/register', params);
}

/**
 * 账号密码登录
 */
export function login(params: LoginParams) {
  return http.post<LoginResponse>('/auth/login', params);
}

/**
 * 微信登录
 */
export function wechatLogin(code: string) {
  return http.post<LoginResponse>('/auth/wechat-login', { wx_code: code });
}

export interface WechatBindEmailParams {
  /** wechat-login 返回 needBindEmail 时下发的 openid */
  wx_openid: string;
  email: string;
  code: string;
  /** 新建模式必填；关联已有账号模式不传 */
  password?: string;
  nickname?: string;
}

/**
 * 微信绑定邮箱-发送验证码
 * registered=true：邮箱已注册未绑微信，走关联模式（隐藏密码框）；false：走新建模式
 */
export function sendWechatBindCode(email: string) {
  return http.post<{ message: string; registered: boolean }>('/auth/wechat-bind-send-code', {
    email,
  });
}

/**
 * 微信绑定邮箱（已注册未绑微信=关联已有账号；未注册=创建账号并登录）
 */
export function wechatBindEmail(params: WechatBindEmailParams) {
  return http.post<LoginResponse>('/auth/wechat-bind-email', params);
}

/**
 * 刷新 Token
 */
export function refreshToken(refreshToken: string) {
  return http.post<LoginResponse>('/auth/refresh-token', { refresh_token: refreshToken });
}

/**
 * 检查邮箱是否已注册（确认账号页）
 */
export function checkEmail(email: string) {
  return http.post<{ registered: boolean }>('/auth/check-email', { email });
}

/**
 * 忘记密码 - 发送验证码（要求邮箱已注册）
 */
export function forgotPasswordSendCode(email: string) {
  return http.post('/auth/forgot-password', { email });
}

/**
 * 忘记密码 - 重置密码
 */
export function forgotPasswordReset(email: string, code: string, newPassword: string) {
  return http.post('/auth/reset-password', {
    email,
    code,
    new_password: newPassword,
  });
}
