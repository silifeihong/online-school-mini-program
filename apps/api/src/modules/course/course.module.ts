import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/entities/admin.entity.js';
import { User } from '../user/entities/user.entity.js';
import { Student } from '../student/entities/student.entity.js';
import { Material } from '../material/entities/material.entity.js';
import { SettingsModule } from '../settings/settings.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { Course } from './entities/course.entity.js';
import { Chapter } from './entities/chapter.entity.js';
import { CourseEnrollment } from './entities/course-enrollment.entity.js';
import { AdminCourseService } from './admin-course.service.js';
import { EnrollmentService } from './enrollment.service.js';
import { MiniCourseService } from './mini-course.service.js';
import { AdminCourseController } from './admin-course.controller.js';
import { AdminEnrollmentController } from './admin-enrollment.controller.js';
import { MiniCourseController } from './mini-course.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Chapter, CourseEnrollment, Material, User, Student, Admin]),
    SettingsModule,
    UploadModule,
  ],
  controllers: [AdminCourseController, AdminEnrollmentController, MiniCourseController],
  providers: [AdminCourseService, EnrollmentService, MiniCourseService],
})
export class CourseModule {}
