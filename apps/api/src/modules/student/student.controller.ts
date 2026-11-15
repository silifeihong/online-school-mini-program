import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FindAllStudentsDto, UpdateStudentStatusDto, ResetPasswordDto } from './dto/student.dto.js';

@ApiTags('学员管理')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @ApiOperation({ summary: '获取学员列表（分页、搜索、过滤）' })
  findAll(@Query() dto: FindAllStudentsDto) {
    return this.studentService.findAll(dto);
  }

  @Get('filter-options')
  @ApiOperation({ summary: '获取列表筛选下拉选项（年级/专业/院校/状态去重值）' })
  getFilterOptions() {
    return this.studentService.getFilterOptions();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学员详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新学员状态（启用/禁用）' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentStatusDto) {
    return this.studentService.updateStatus(id, dto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置学员密码' })
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto) {
    return this.studentService.resetPassword(id, dto);
  }
}
