/**
 * 用户相关类型定义
 */

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

// 用户基础信息
export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar_url?: string;
  wx_openid?: string;
  wx_unionid?: string;
  is_email_verified: boolean;
  is_profile_completed: boolean;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// 学员扩展信息
export interface StudentProfile {
  id: number;
  user_id: number;
  grade: string;
  major: string;
  university: string;
  created_at: string;
  updated_at: string;
}

// 学员完整信息（用户 + 学员扩展）
export interface Student extends User {
  student_profile?: StudentProfile;
}

// 管理员
export interface Admin {
  id: number;
  username: string;
  real_name: string;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User | Admin;
}

// 邮箱注册请求
export interface RegisterRequest {
  email: string;
  code: string;
  password: string;
  nickname: string;
  wx_code: string;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 微信登录请求
export interface WechatLoginRequest {
  wx_code: string;
}

// 微信绑定邮箱请求
export interface WechatBindEmailRequest {
  wx_code: string;
  email: string;
  code: string;
  password: string;
  nickname: string;
}

// 更新个人信息请求
export interface UpdateProfileRequest {
  grade: string;
  major: string;
  university: string;
}

// 重置密码请求
export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

// 学员列表筛选参数
export interface StudentFilterParams {
  keyword?: string;
  grade?: string;
  major?: string;
  university?: string;
  status?: UserStatus;
  start_date?: string;
  end_date?: string;
}
