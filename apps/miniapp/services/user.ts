import { http, uploadFile } from '../utils/request';

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string | null;
  is_email_verified: boolean;
  is_profile_completed: boolean;
  status: string;
  student_profile: {
    grade: string;
    major: string;
    university: string;
  } | null;
}

export interface UpdateProfileParams {
  /** 昵称（不传则不修改） */
  nickname?: string;
  grade: string;
  major: string;
  university: string;
}

/**
 * 获取个人信息
 */
export function getProfile() {
  return http.get<UserProfile>('/user/profile');
}

/**
 * 更新个人信息
 */
export function updateProfile(params: UpdateProfileParams) {
  return http.put('/user/profile', params);
}

/**
 * 上传头像（multipart，字段名 file，≤5MB），成功后返回新的头像地址
 */
export function uploadAvatar(filePath: string) {
  return uploadFile<{ avatar_url: string }>({ url: '/user/avatar', filePath });
}
