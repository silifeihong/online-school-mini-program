import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity.js';

export const SETTING_KEY_SALES_WECHAT = 'sales_wechat';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const row = await this.settingRepo.findOne({ where: { key } });
    return row ? row.value : null;
  }

  async set(key: string, value: string): Promise<void> {
    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      await this.settingRepo.save(existing);
    } else {
      await this.settingRepo.save(this.settingRepo.create({ key, value }));
    }
  }
}
