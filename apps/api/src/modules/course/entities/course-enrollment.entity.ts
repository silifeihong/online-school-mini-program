import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
// 循环引用防护：Course 仅作类型使用，关系目标用实体名字符串
import type { Course } from './course.entity.js';
import { User } from '../../user/entities/user.entity.js';

/**
 * 课程学员关系（已购）。created_at 即 joined_at；移出=硬删除。
 */
@Entity('course_enrollments')
@Unique(['course_id', 'user_id'])
export class CourseEnrollment extends BaseEntity {
  @Column({ name: 'course_id', type: 'int' })
  course_id: number;

  @ManyToOne('Course', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'user_id', type: 'int' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
