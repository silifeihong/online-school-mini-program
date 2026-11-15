import { Controller, Post, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminLoginDto, ChangePasswordDto } from './dto/admin.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('管理员')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理员登录' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Token' })
  refreshToken(@Body() body: { refresh_token: string }) {
    return this.adminService.refreshToken(body.refresh_token);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  changePassword(@CurrentUser('id') adminId: number, @Body() dto: ChangePasswordDto) {
    return this.adminService.changePassword(adminId, dto);
  }
}
