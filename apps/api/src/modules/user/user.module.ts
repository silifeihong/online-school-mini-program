import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { User } from './entities/user.entity.js';
import { Student } from '../student/entities/student.entity.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student]), UploadModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
