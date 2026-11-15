import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';

@Entity('email_codes')
@Index(['email', 'code'])
export class EmailCode extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expires_at: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  is_used: boolean;
}
