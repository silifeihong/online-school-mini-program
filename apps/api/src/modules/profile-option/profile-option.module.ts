import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileOptionController } from './profile-option.controller.js';
import { ProfileOptionService } from './profile-option.service.js';
import { ProfileOption } from './entities/profile-option.entity.js';
import { Admin } from '../admin/entities/admin.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileOption, Admin])],
  controllers: [ProfileOptionController],
  providers: [ProfileOptionService],
  exports: [ProfileOptionService],
})
export class ProfileOptionModule {}
