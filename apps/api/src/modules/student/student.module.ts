import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller.js';
import { StudentService } from './student.service.js';
import { Student } from './entities/student.entity.js';
import { User } from '../user/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Student, User])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
