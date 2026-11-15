import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { CourseStatus } from '../../../common/enums/content.enums.js';

/** 资料文件项：file_meta 由后端根据上传文件信息生成，前端不可直接编辑 */
export interface MaterialFileItem {
  file_url: string;
  file_name: string | null;
  file_meta: string | null;
}

@Entity('materials')
export class Material extends BaseEntity {
  @ApiProperty({ description: '资料标题' })
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @ApiProperty({ description: '封面图 URL' })
  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  cover_url: string | null;

  @ApiProperty({ description: '资料文件列表（多文件）' })
  @Column({ type: 'simple-json', nullable: true })
  files: MaterialFileItem[] | null;

  @ApiProperty({ description: '图文内容（富文本 HTML），小程序端展示在文件上方' })
  @Column({ type: 'mediumtext', nullable: true })
  content: string | null;

  @ApiProperty({ description: '资料简介' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: '上下架状态', enum: CourseStatus })
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  @Index()
  status: CourseStatus;
}
