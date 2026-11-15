import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { ChapterContentType } from '../../../common/enums/content.enums.js';
// 循环引用防护：Course 仅作类型使用，关系目标用实体名字符串
import type { Course } from './course.entity.js';

@Entity('chapters')
@Index(['course_id', 'sort_order'])
export class Chapter extends BaseEntity {
  @Column({ name: 'course_id', type: 'int' })
  course_id: number;

  @ManyToOne('Course', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ApiProperty({ description: '章节标题' })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiProperty({ description: '章节简介（播放页展示）' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @ApiProperty({ description: '内容类型：视频/文档', enum: ChapterContentType })
  @Column({ name: 'content_type', type: 'enum', enum: ChapterContentType, default: ChapterContentType.VIDEO })
  content_type: ChapterContentType;

  @ApiProperty({ description: '内容文件地址（视频或文档）' })
  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  file_url: string | null;

  @ApiProperty({ description: '是否可试看' })
  @Column({ name: 'is_trial', type: 'boolean', default: false })
  is_trial: boolean;

  @ApiProperty({ description: '排序值（升序）' })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;
}
