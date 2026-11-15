/**
 * 课程 / 章节 / 资料 / 学员关系 相关类型定义（Phase 2）
 */

// 课程/资料状态：draft=草稿（从未发布）、on=已上架、off=已下架
export enum CourseStatus {
  DRAFT = 'draft',
  ON = 'on',
  OFF = 'off',
}

// 付费类型
export enum PaymentType {
  PAID = 'paid',
  FREE = 'free',
}

// 章节内容类型
export enum ChapterContentType {
  VIDEO = 'video',
  DOCUMENT = 'document',
}

// 小程序端章节访问状态
export enum ChapterState {
  TRIAL = 'trial', // 可试看（任何人）
  UNLOCKED = 'unlocked', // 已解锁（已购或免费课程登录用户）
  LOCKED = 'locked', // 锁定（需登录/购买）
}

// 课程基础信息
export interface Course {
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
}

// 管理端课程列表项（含聚合计数）
export interface CourseListItem extends Course {
  chapter_count: number;
  student_count: number;
}

// 章节
export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  content_type: ChapterContentType;
  file_url: string | null;
  is_trial: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// 小程序端章节（带访问状态）
export interface CourseChapter extends Chapter {
  state: ChapterState;
}

// 小程序端课程详情
export interface CourseDetail extends Course {
  chapter_count: number;
  chapters: CourseChapter[];
  enrolled: boolean;
  sales_wechat?: string | null;
}

// 课程学员（enrollment）
export interface CourseEnrollment {
  id: number;
  course_id: number;
  user_id: number;
  joined_at: string;
}

// 管理端课程学员列表行
export interface EnrollmentStudent {
  enrollment_id: number;
  user_id: number;
  openid_masked: string | null;
  nickname: string;
  grade: string;
  major: string;
  university: string;
  joined_at: string;
}

// 管理端添加学员候选行（已加入者灰显禁选）
export interface CandidateStudent {
  user_id: number;
  openid_masked: string | null;
  nickname: string;
  grade: string;
  major: string;
  university: string;
  enrolled: boolean;
}

// 资料文件项（一份资料可含多个文件；file_meta 由后端根据上传文件信息生成）
export interface MaterialFile {
  file_url: string;
  file_name: string | null;
  file_meta: string | null;
}

// 资料
export interface Material {
  id: number;
  title: string;
  cover_url: string | null;
  files: MaterialFile[] | null;
  /** 图文内容（富文本 HTML），小程序端展示顺序高于文件 */
  content?: string | null;
  description?: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

// 小程序首页混排内容项（全部 tab）
export type FeedItem =
  | { kind: 'course'; data: CourseListItem }
  | { kind: 'material'; data: Material };

// 播放/下载地址签发响应
export interface SignedUrlResponse {
  url: string;
  expires_in: number; // 秒
}

// 上传 STS 凭证响应（双模式）
export type UploadStsResponse =
  | {
      mode: 'oss';
      credentials: {
        accessKeyId: string;
        accessKeySecret: string;
        securityToken: string;
        expiration: string;
      };
      bucket: string;
      region: string;
      prefix: string;
    }
  | { mode: 'mock' };

// mock 上传响应
export interface MockUploadResponse {
  url: string;
  filename: string;
  size: number;
}
