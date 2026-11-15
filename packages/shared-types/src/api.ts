/**
 * API 响应格式
 */

// 成功响应（有数据）
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应数据
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}
