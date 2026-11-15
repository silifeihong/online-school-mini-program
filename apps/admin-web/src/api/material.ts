import request from '@/utils/request';
import type { CourseStatus, ListResponse } from './course';

/** 资料文件项：file_meta 由后端根据上传文件信息生成（前端不可直接编辑） */
export interface MaterialFile {
  file_url: string;
  file_name: string | null;
  file_meta: string | null;
}

export interface Material {
  id: number;
  title: string;
  cover_url: string | null;
  files: MaterialFile[] | null;
  /** 图文内容（富文本 HTML），小程序端展示顺序高于文件 */
  content: string | null;
  description: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface MaterialListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: CourseStatus;
}

/** 提交的文件项：新上传文件带 file_name/file_size 由后端生成 file_meta；已存在文件仅需 file_url（后端保留原文件信息） */
export interface MaterialFileParam {
  file_url: string;
  file_name?: string;
  file_size?: number;
}

export interface CreateMaterialParams {
  title: string;
  cover_url?: string | null;
  /** 多文件列表：整体替换；null / [] 清空全部文件；缺省不变 */
  files?: MaterialFileParam[] | null;
  /** 图文内容（富文本 HTML）：null 清空；缺省不变 */
  content?: string | null;
  description?: string;
}

export type UpdateMaterialParams = Partial<CreateMaterialParams>;

export function getMaterialList(params: MaterialListParams): Promise<ListResponse<Material>> {
  return request.get('/admin/materials', { params });
}

export function createMaterial(data: CreateMaterialParams): Promise<Material> {
  return request.post('/admin/materials', data);
}

export function getMaterialDetail(id: number): Promise<Material> {
  return request.get(`/admin/materials/${id}`);
}

export function updateMaterial(id: number, data: UpdateMaterialParams): Promise<Material> {
  return request.put(`/admin/materials/${id}`, data);
}

export function deleteMaterial(id: number): Promise<null> {
  return request.delete(`/admin/materials/${id}`);
}

export function updateMaterialStatus(id: number, status: CourseStatus): Promise<Material> {
  return request.put(`/admin/materials/${id}/status`, { status });
}
