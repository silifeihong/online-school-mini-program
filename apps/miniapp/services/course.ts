import { http } from '../utils/request';

// 与 packages/shared-types course.ts 保持一致的本地接口定义

export type CourseStatus = 'draft' | 'on' | 'off';
export type PaymentType = 'paid' | 'free';
export type ChapterContentType = 'video' | 'document';
export type ChapterState = 'trial' | 'unlocked' | 'locked';

export interface CourseListItem {
  id: number;
  title: string;
  cover_url: string | null;
  subtitle?: string | null;
  teacher?: string | null;
  description?: string | null;
  payment_type: PaymentType;
  price: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  chapter_count: number;
  student_count: number;
}

export interface CourseChapter {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  content_type: ChapterContentType;
  is_trial: boolean;
  sort_order: number;
  state: ChapterState;
}

export interface CourseDetail {
  id: number;
  title: string;
  cover_url: string | null;
  subtitle?: string | null;
  teacher?: string | null;
  description?: string | null;
  payment_type: PaymentType;
  price: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  chapter_count: number;
  chapters: CourseChapter[];
  enrolled: boolean;
  sales_wechat?: string | null;
}

/** 资料文件项：file_meta 由后端根据上传文件信息生成 */
export interface MaterialFileItem {
  file_url: string;
  file_name: string | null;
  file_meta: string | null;
}

export interface MaterialItem {
  id: number;
  title: string;
  cover_url: string | null;
  /** 资料文件列表（多文件） */
  files?: MaterialFileItem[] | null;
  /** 图文内容（富文本 HTML），展示顺序高于文件 */
  content?: string | null;
  description?: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export type FeedItem =
  | { kind: 'course'; data: CourseListItem }
  | { kind: 'material'; data: MaterialItem };

export interface FeedResponse {
  list: FeedItem[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface SignedUrlResponse {
  url: string;
  expires_in: number;
}

export interface FeedParams {
  keyword?: string;
  type?: 'course' | 'material' | 'all';
  page?: number;
  limit?: number;
}

/**
 * 首页内容列表（全部=课程+资料混排）
 */
export function getFeed(params: FeedParams) {
  return http.get<FeedResponse>('/courses', params);
}

/**
 * 我的课程（当前用户已加入的课程列表）
 */
export function getMyCourses() {
  return http.get<CourseListItem[]>('/courses/my');
}

/**
 * 课程详情（目录带 trial/unlocked/locked 三态）
 */
export function getCourseDetail(id: number) {
  return http.get<CourseDetail>(`/courses/${id}`);
}

/**
 * 获取章节播放/文档地址（限时签名 URL）
 */
export function getPlayUrl(courseId: number, chapterId: number) {
  return http.get<SignedUrlResponse>(
    `/courses/${courseId}/chapters/${chapterId}/play-url`,
    undefined,
  );
}
