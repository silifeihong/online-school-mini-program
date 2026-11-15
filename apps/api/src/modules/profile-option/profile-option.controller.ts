import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileOptionService } from './profile-option.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard.js';
import {
  CreateProfileOptionDto,
  QueryProfileOptionsDto,
  UpdateProfileOptionDto,
} from './dto/profile-option.dto.js';

@ApiTags('个人信息选项')
@Controller('profile-options')
@ApiBearerAuth()
export class ProfileOptionController {
  constructor(private readonly profileOptionService: ProfileOptionService) {}

  @Get('enabled')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取已启用选项（小程序端，按分类分组）' })
  findEnabled() {
    return this.profileOptionService.findEnabledGrouped();
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: '获取全部选项（管理端，可按分类过滤）' })
  findAll(@Query() query: QueryProfileOptionsDto) {
    return this.profileOptionService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: '创建选项（管理端）' })
  create(@Body() dto: CreateProfileOptionDto) {
    return this.profileOptionService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: '更新选项（管理端）' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProfileOptionDto) {
    return this.profileOptionService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @ApiOperation({ summary: '删除选项（管理端）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.profileOptionService.remove(id);
  }
}
