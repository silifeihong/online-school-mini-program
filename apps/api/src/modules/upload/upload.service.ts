import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@online-school/shared-types';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { OssService } from './oss.service.js';

/** 允许的上传类别 → 落盘子目录，及各自大小上限（字节） */
export const UPLOAD_KINDS = {
  cover: 30 * 1024 * 1024, // 封面/图片 30MB
  video: 500 * 1024 * 1024, // 课件视频 500MB
  document: 100 * 1024 * 1024, // 文档课件 100MB
  material: 100 * 1024 * 1024, // 资料文件 100MB
  avatar: 5 * 1024 * 1024, // 用户头像 5MB
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly ossService: OssService,
    private readonly config: ConfigService,
  ) {}

  /** STS 直传凭证；OSS 未配置完整则返回 mock 模式 */
  async getStsCredentials(prefix: UploadKind) {
    if (!this.ossService.isStsConfigured) {
      return { mode: 'mock' as const };
    }
    const credentials = await this.ossService.assumeRole(prefix);
    return {
      mode: 'oss' as const,
      credentials,
      bucket: this.config.get<string>('oss.bucket'),
      region: this.config.get<string>('oss.region'),
      prefix,
    };
  }

  /**
   * mock 上传：文件落盘 <cwd>/uploads/<kind>/，返回可公网访问的绝对 URL
   * （由 main.ts 静态托管 /uploads/）。
   */
  saveMockFile(
    kind: string,
    file: { originalname: string; size: number; path: string },
    request: { protocol: string; get(name: string): string | undefined },
  ) {
    if (!(kind in UPLOAD_KINDS)) {
      this.removeQuietly(file.path);
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: `不支持的上传类别: ${kind}`,
      });
    }
    const limit = UPLOAD_KINDS[kind as UploadKind];
    if (file.size > limit) {
      this.removeQuietly(file.path);
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: `文件超过大小限制（${Math.floor(limit / 1024 / 1024)}MB）`,
      });
    }

    const dir = join(process.cwd(), 'uploads', kind);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${extname(file.originalname)}`;
    const target = join(dir, filename);
    // multer diskStorage 已写入临时文件，重命名到规范文件名
    renameSync(file.path, target);

    const base =
      this.config.get<string>('oss.publicBaseUrl') ||
      `${request.protocol}://${request.get('host')}`;
    const url = `${base}/uploads/${kind}/${filename}`;
    this.logger.log(`mock 上传: ${file.originalname} -> ${url} (${file.size} bytes)`);
    return { url, filename: file.originalname, size: file.size };
  }

  private removeQuietly(path: string): void {
    try {
      unlinkSync(path);
    } catch {
      /* 忽略清理失败 */
    }
  }
}
