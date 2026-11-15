/**
 * 课程内容相关枚举（Phase 2）
 */

// 课程/资料状态：draft=草稿（创建后从未发布）、on=已上架、off=已下架（发布过后下架）
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
