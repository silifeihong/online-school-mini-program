import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/entities/admin.entity.js';
import { UploadModule } from '../upload/upload.module.js';
import { Material } from './entities/material.entity.js';
import { MaterialService } from './material.service.js';
import { AdminMaterialController } from './admin-material.controller.js';
import { MiniMaterialController } from './mini-material.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Admin]), UploadModule],
  controllers: [AdminMaterialController, MiniMaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
