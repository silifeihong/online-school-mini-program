import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/entities/admin.entity.js';
import { OssService } from './oss.service.js';
import { UploadService } from './upload.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  controllers: [UploadController],
  providers: [OssService, UploadService],
  exports: [OssService, UploadService],
})
export class UploadModule {}
