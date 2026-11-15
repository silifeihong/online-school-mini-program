import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MaterialService } from './material.service.js';
import { MiniDownloadUrlQueryDto, QueryMiniMaterialsDto } from './dto/material.dto.js';

@ApiTags('小程序-资料')
@Controller('materials')
export class MiniMaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  @ApiOperation({ summary: '资料列表（仅上架；游客可见）' })
  findList(@Query() query: QueryMiniMaterialsDto) {
    return this.materialService.findMiniList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '资料详情（仅上架；游客可见）' })
  findDetail(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findMiniDetail(id);
  }

  @Get(':id/download-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取资料下载地址（需登录，限时签名 URL；多文件用 index 指定）' })
  getDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MiniDownloadUrlQueryDto,
  ) {
    return this.materialService.getDownloadUrl(id, query.index ?? 0);
  }
}
