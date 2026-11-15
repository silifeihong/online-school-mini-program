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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard.js';
import { MaterialService } from './material.service.js';
import {
  AdminQueryMaterialsDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  UpdateMaterialStatusDto,
} from './dto/material.dto.js';

@ApiTags('后台-资料管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/materials')
export class AdminMaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  @ApiOperation({ summary: '资料列表（关键词/状态筛选）' })
  findAll(@Query() query: AdminQueryMaterialsDto) {
    return this.materialService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '新建资料（默认下架）' })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '资料详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新资料' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialDto) {
    return this.materialService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除资料' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '上架/下架资料' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialStatusDto) {
    return this.materialService.updateStatus(id, dto.status);
  }
}
