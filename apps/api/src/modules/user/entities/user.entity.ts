import { Entity, Column, Index, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: '邮箱' })
  @Column({ type: 'varchar', length: 255, unique: true })
  //@Index()
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password_hash: string;

  @ApiProperty({ description: '昵称' })
  @Column({ type: 'varchar', length: 100 })
  nickname: string;

  @ApiProperty({ description: '头像URL' })
  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ name: 'wx_openid', type: 'varchar', length: 255, unique: true, nullable: true })
  //@Index()
  wx_openid: string | null;

  @Column({ name: 'wx_unionid', type: 'varchar', length: 255, nullable: true })
  @Index()
  wx_unionid: string | null;

  @ApiProperty({ description: '邮箱是否已验证' })
  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  is_email_verified: boolean;

  @ApiProperty({ description: '个人信息是否已完善' })
  @Column({ name: 'is_profile_completed', type: 'boolean', default: false })
  is_profile_completed: boolean;

  @ApiProperty({ description: '账号状态', enum: UserStatus })
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
}
