import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

@Entity('admins')
export class Admin extends BaseEntity {
  @ApiProperty({ description: '用户名' })
  @Column({ type: 'varchar', length: 100, unique: true })
  //@Index()
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password_hash: string;

  @ApiProperty({ description: '真实姓名' })
  @Column({ name: 'real_name', type: 'varchar', length: 100 })
  real_name: string;

  @ApiProperty({ description: '账号状态', enum: UserStatus })
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ description: '最后登录时间' })
  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  last_login_at: Date;
}
