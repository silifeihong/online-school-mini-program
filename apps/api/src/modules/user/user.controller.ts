import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ErrorCode } from '@online-school/shared-types';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';
import { UserService } from './user.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UploadService, UPLOAD_KINDS } from '../upload/upload.service.js';
import { User } from './entities/user.entity.js';
import { UpdateProfileDto } from './dto/user.dto.js';

const TMP_DIR = join(process.cwd(), 'uploads', 'tmp');

@ApiTags('用户')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: '获取个人信息' })
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: '更新个人信息（昵称 + 年级/专业/院校）' })
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: '上传头像（multipart，字段名 file，≤5MB）' })
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
      limits: { fileSize: UPLOAD_KINDS.avatar },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException({ code: ErrorCode.PARAM_ERROR, message: '请选择要上传的图片' });
    }
    // multer 以 latin1 解析文件名，转回 utf8 避免中文乱码
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const { url } = this.uploadService.saveMockFile(
      'avatar',
      { originalname, size: file.size, path: file.path },
      req,
    );
    return this.userService.updateAvatar(user.id, url);
  }
}
