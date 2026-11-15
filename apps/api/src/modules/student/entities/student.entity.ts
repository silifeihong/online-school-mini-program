import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('students')
@Index(['grade', 'major', 'university'])
export class Student extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', unique: true })
  //@Index()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '当前年级' })
  @Column({ type: 'varchar', length: 50 })
  grade: string;

  @ApiProperty({ description: '所学专业' })
  @Column({ type: 'varchar', length: 100 })
  major: string;

  @ApiProperty({ description: '所属院校' })
  @Column({ type: 'varchar', length: 200 })
  university: string;
}
