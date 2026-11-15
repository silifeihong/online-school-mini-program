import { Entity, Column, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { CourseStatus, PaymentType } from '../../../common/enums/content.enums.js';
// 循环引用防护：Chapter/CourseEnrollment 仅作类型使用，关系目标用实体名字符串
import type { Chapter } from './chapter.entity.js';
import type { CourseEnrollment } from './course-enrollment.entity.js';

// decimal 列 TypeORM 返回字符串，统一转 number
export const decimalTransformer = {
  to: (value?: number) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};

@Entity('courses')
export class Course extends BaseEntity {
  @ApiProperty({ description: '课程标题' })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiProperty({ description: '封面图 URL' })
  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  cover_url: string | null;

  @ApiProperty({ description: '副标题/卖点' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  subtitle: string | null;

  @ApiProperty({ description: '讲师' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  teacher: string | null;

  @ApiProperty({ description: '课程简介（纯文本）' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: '付费类型', enum: PaymentType })
  @Column({ name: 'payment_type', type: 'enum', enum: PaymentType, default: PaymentType.PAID })
  payment_type: PaymentType;

  @ApiProperty({ description: '价格（免费课程强制 0）' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  price: number;

  @ApiProperty({ description: '上下架状态', enum: CourseStatus })
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  @Index()
  status: CourseStatus;

  @OneToMany('Chapter', 'course')
  chapters: Chapter[];

  @OneToMany('CourseEnrollment', 'course')
  enrollments: CourseEnrollment[];
}
