import { Entity, Column, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';

/**
 * 个人信息表单选项分类
 */
export enum ProfileOptionCategory {
  /** 年级 */
  GRADE = 'grade',
  /** 专业 */
  MAJOR = 'major',
  /** 所属院校 */
  UNIVERSITY = 'university',
}

@Entity('profile_options')
@Unique('uk_profile_option_category_name', ['category', 'name'])
export class ProfileOption extends BaseEntity {
  @ApiProperty({ description: '所属分类：grade/major/university' })
  @Column({ type: 'varchar', length: 20 })
  category: string;

  @ApiProperty({ description: '选项名称' })
  @Column({ type: 'varchar', length: 30 })
  name: string;

  @ApiProperty({ description: '排序值，越小越靠前' })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;

  @ApiProperty({ description: '是否启用' })
  @Column({ name: 'is_enabled', type: 'tinyint', width: 1, default: true })
  is_enabled: boolean;
}
