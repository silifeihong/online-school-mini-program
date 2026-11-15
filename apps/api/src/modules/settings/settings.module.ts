import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admin/entities/admin.entity.js';
import { AppSetting } from './entities/app-setting.entity.js';
import { SettingsService } from './settings.service.js';
import { AdminSettingsController } from './admin-settings.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting, Admin])],
  controllers: [AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
