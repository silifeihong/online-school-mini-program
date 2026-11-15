import { http } from '../utils/request';

export interface ProfileOption {
  id: number;
  category: string;
  name: string;
  sort_order: number;
  is_enabled: boolean;
}

/**
 * 已启用选项（按分类分组），来源于管理后台「个人信息管理」维护的数据
 */
export type EnabledOptions = Record<'grade' | 'major' | 'university', ProfileOption[]>;

/**
 * 获取已启用的个人信息选项
 */
export function getEnabledOptions() {
  return http.get<EnabledOptions>('/profile-options/enabled');
}
