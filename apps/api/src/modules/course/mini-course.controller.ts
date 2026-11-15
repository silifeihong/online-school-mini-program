import { Controller, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MiniCourseService, RequestUser } from './mini-course.service.js';
import { QueryMiniFeedDto } from './dto/mini-course.dto.js';

@ApiTags('小程序-课程')
@Controller('courses')
export class MiniCourseController {
  constructor(private readonly miniCourseService: MiniCourseService) {}

  @Get()
  @ApiOperation({ summary: '首页内容列表（type=all 课程+资料混排；游客可访问）' })
  findFeed(@Query() query: QueryMiniFeedDto) {
    return this.miniCourseService.findFeed(query);
  }

  // 注意：'my' 必须声明在 ':id' 之前，否则会被 ParseIntPipe 路由吞掉
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '我的课程（当前用户已加入的课程列表）' })
  findMy(@Req() req: Request) {
    return this.miniCourseService.findMyCourses((req.user as RequestUser).id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '课程详情（目录三态；登录后返回 enrolled 与销售微信号）' })
  getDetail(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.miniCourseService.getDetail(id, (req.user as RequestUser) ?? null);
  }

  @Get(':id/chapters/:chapterId/play-url')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取章节播放/文档地址（试看公开、免费登录可看、付费已购可看）' })
  getPlayUrl(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Req() req: Request,
  ) {
    return this.miniCourseService.getPlayUrl(id, chapterId, (req.user as RequestUser) ?? null);
  }
}
