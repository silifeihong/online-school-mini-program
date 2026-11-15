import request from '@/utils/request';

export type ProfileOptionCategory = 'grade' | 'major' | 'university';

export interface ProfileOption {
  id: number;
  category: ProfileOptionCategory;
  name: string;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileOptionPayload {
  category: ProfileOptionCategory;
  name: string;
  sort_order: number;
  is_enabled?: boolean;
}

/**
 * 获取全部选项（可按分类过滤）
 */
export function getProfileOptions(params?: {
  category?: ProfileOptionCategory;
}): Promise<ProfileOption[]> {
  return request.get('/profile-options', { params });
}

/**
 * 创建选项
 */
export function createProfileOption(data: ProfileOptionPayload): Promise<ProfileOption> {
  return request.post('/profile-options', data);
}

/**
 * 更新选项
 */
export function updateProfileOption(
  id: number,
  data: Partial<ProfileOptionPayload>
): Promise<ProfileOption> {
  return request.put(`/profile-options/${id}`, data);
}

/**
 * 删除选项
 */
export function deleteProfileOption(id: number): Promise<void> {
  return request.delete(`/profile-options/${id}`);
}
