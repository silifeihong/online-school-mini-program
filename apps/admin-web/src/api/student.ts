import request from '@/utils/request';

export interface StudentListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  grade?: string;
  major?: string;
  university?: string;
}

export interface StudentFilterOptions {
  grade: string[];
  major: string[];
  university: string[];
  status: string[];
}

export interface Student {
  id: number;
  user_id: number;
  email: string;
  nickname: string;
  avatar_url: string | null;
  wx_openid: string | null;
  status: string;
  is_email_verified: boolean;
  is_profile_completed: boolean;
  grade: string;
  major: string;
  university: string;
  created_at: string;
  updated_at: string;
}

export interface StudentListResponse {
  list: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取学员列表
 */
export function getStudentList(params: StudentListParams): Promise<StudentListResponse> {
  return request.get('/students', { params });
}

/**
 * 获取列表筛选下拉选项（年级/专业/院校/状态去重值）
 */
export function getStudentFilterOptions(): Promise<StudentFilterOptions> {
  return request.get('/students/filter-options');
}

/**
 * 获取学员详情
 */
export function getStudentDetail(id: number): Promise<Student> {
  return request.get(`/students/${id}`);
}

/**
 * 更新学员状态
 */
export function updateStudentStatus(id: number, status: string): Promise<void> {
  return request.put(`/students/${id}/status`, { status });
}

/**
 * 重置学员密码
 */
export function resetStudentPassword(id: number, password: string): Promise<void> {
  return request.post(`/students/${id}/reset-password`, { password });
}
