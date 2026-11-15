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
import { AdminCourseService } from './admin-course.service.js';
import {
  AdminQueryCoursesDto,
  CreateChapterDto,
  CreateCourseDto,
  SortChaptersDto,
  UpdateChapterDto,
  UpdateCourseDto,
  UpdateCourseStatusDto,
} from './dto/course.dto.js';

@ApiTags('后台-课程管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/courses')
export class AdminCourseController {
  constructor(private readonly courseService: AdminCourseService) {}

  @Get()
  @ApiOperation({ summary: '课程列表（关键词/付费类型/状态筛选，含章节数与学员数）' })
  findAll(@Query() query: AdminQueryCoursesDto) {
    return this.courseService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '创建课程（默认下架草稿）' })
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '课程详情（含章节，编辑回显）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findDetail(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新课程信息（免费类型强制价格为 0）' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除课程（章节与学员关系级联删除）' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.remove(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '上架/下架课程' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseStatusDto,
  ) {
    return this.courseService.updateStatus(id, dto.status);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布课程（校验封面与章节后置为上架）' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.publish(id);
  }

  // ---------- 章节（'chapters/sort' 必须先于 ':chapterId' 声明） ----------

  @Get(':id/chapters')
  @ApiOperation({ summary: '章节列表' })
  listChapters(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.listChapters(id);
  }

  @Post(':id/chapters')
  @ApiOperation({ summary: '新增章节（video/document）' })
  addChapter(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateChapterDto) {
    return this.courseService.addChapter(id, dto);
  }

  @Put(':id/chapters/sort')
  @ApiOperation({ summary: '章节拖拽排序（传全量章节 id 顺序）' })
  sortChapters(@Param('id', ParseIntPipe) id: number, @Body() dto: SortChaptersDto) {
    return this.courseService.sortChapters(id, dto);
  }

  @Put(':id/chapters/:chapterId')
  @ApiOperation({ summary: '更新章节' })
  updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.courseService.updateChapter(id, chapterId, dto);
  }

  @Delete(':id/chapters/:chapterId')
  @ApiOperation({ summary: '删除章节' })
  removeChapter(
    @Param('id', ParseIntPipe) id: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ) {
    return this.courseService.removeChapter(id, chapterId);
  }
}
