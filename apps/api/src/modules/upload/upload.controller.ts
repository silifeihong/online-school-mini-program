import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErrorCode } from '@online-school/shared-types';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard.js';
import { UploadService, UPLOAD_KINDS } from './upload.service.js';
import { UploadStsDto } from './dto/upload.dto.js';

const TMP_DIR = join(process.cwd(), 'uploads', 'tmp');

@ApiTags('后台-上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('admin/uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('sts')
  @ApiOperation({ summary: '获取 OSS STS 直传凭证（未配置 OSS 时返回 mock 模式）' })
  getSts(@Body() dto: UploadStsDto) {
    return this.uploadService.getStsCredentials(dto.kind);
  }

  @Post('mock')
  @ApiOperation({ summary: 'mock 上传：文件落盘服务器本地 uploads/ 并返回访问 URL' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
          cb(null, TMP_DIR);
        },
        filename: (_req, file, cb) => {
          cb(null, `${Date.now()}-${randomBytes(4).toString('hex')}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: Math.max(...Object.values(UPLOAD_KINDS)) },
    }),
  )
  mockUpload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('kind') kind: string,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException({ code: ErrorCode.PARAM_ERROR, message: '请选择要上传的文件' });
    }
    // multer 以 latin1 解析文件名，转回 utf8 避免中文乱码
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    return this.uploadService.saveMockFile(
      kind,
      { originalname, size: file.size, path: file.path },
      req,
    );
  }
}
