import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard.js';
import { EnrollmentService } from './enrollment.service.js';
import {
  BatchAddStudentsDto,
  QueryCandidateStudentsDto,
  QueryEnrolledStudentsDto,
} from './dto/enrollment.dto.js';

@ApiTags('后台-课程学员管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/courses/:courseId/students')
export class AdminEnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  @ApiOperation({ summary: '课程学员列表（掩码 OpenID，按加入时间倒序）' })
  findStudents(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: QueryEnrolledStudentsDto,
  ) {
    return this.enrollmentService.findStudents(courseId, query);
  }

  @Get('candidates')
  @ApiOperation({ summary: '候选学员列表（全部正常学员，已加入的标记 enrolled=true）' })
  findCandidates(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: QueryCandidateStudentsDto,
  ) {
    return this.enrollmentService.findCandidates(courseId, query);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量添加学员（任一重复则整体拒绝，16005）' })
  batchAdd(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: BatchAddStudentsDto,
  ) {
    return this.enrollmentService.batchAdd(courseId, dto);
  }

  @Delete(':userId')
  @ApiOperation({ summary: '移出学员（硬删除关系）' })
  removeStudent(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.enrollmentService.removeStudent(courseId, userId);
  }
}
