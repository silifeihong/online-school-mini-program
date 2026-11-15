import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard.js';
import { SettingsService, SETTING_KEY_SALES_WECHAT } from './settings.service.js';
import { UpdateSalesWechatDto } from './dto/settings.dto.js';

@ApiTags('后台-系统设置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('sales-wechat')
  @ApiOperation({ summary: '获取销售微信号' })
  async getSalesWechat() {
    const sales_wechat = await this.settingsService.get(SETTING_KEY_SALES_WECHAT);
    return { sales_wechat };
  }

  @Put('sales-wechat')
  @ApiOperation({ summary: '保存销售微信号' })
  async updateSalesWechat(@Body() dto: UpdateSalesWechatDto) {
    await this.settingsService.set(SETTING_KEY_SALES_WECHAT, dto.sales_wechat.trim());
    return { sales_wechat: dto.sales_wechat.trim() };
  }
}
