import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';

@Entity('app_settings')
export class AppSetting extends BaseEntity {
  @ApiProperty({ description: '配置键' })
  @Column({ type: 'varchar', length: 50, unique: true })
  key: string;

  @ApiProperty({ description: '配置值' })
  @Column({ type: 'varchar', length: 255 })
  value: string;
}
