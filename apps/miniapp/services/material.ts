import { http } from '../utils/request';
import { MaterialItem } from './course';

export interface MaterialListResponse {
  list: MaterialItem[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

/**
 * 资料列表（仅上架）
 */
export function getMaterialList(params: { keyword?: string; page?: number; limit?: number }) {
  return http.get<MaterialListResponse>('/materials', params);
}

/**
 * 资料详情（仅上架；游客可见）
 */
export function getMaterialDetail(id: number) {
  return http.get<MaterialItem>(`/materials/${id}`);
}

/**
 * 获取资料下载地址（需登录，限时签名 URL；多文件用 index 指定第几个）
 */
export function getMaterialDownloadUrl(id: number, index = 0) {
  return http.get<{ url: string; expires_in: number }>(`/materials/${id}/download-url`, { index });
}
