import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '@online-school/shared-types';
import { CourseStatus } from '../../common/enums/content.enums.js';
import { OssService } from '../upload/oss.service.js';
import { Material, MaterialFileItem } from './entities/material.entity.js';
import {
  AdminQueryMaterialsDto,
  CreateMaterialDto,
  MaterialFileDto,
  QueryMiniMaterialsDto,
  UpdateMaterialDto,
} from './dto/material.dto.js';

const DOWNLOAD_URL_EXPIRES_IN = 900;

/** 文件大小格式化：与 admin-web utils/upload.ts formatSize 保持一致 */
function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${size}B`;
}

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    private readonly ossService: OssService,
  ) {}

  // ---------- 管理端 ----------

  async findAll(dto: AdminQueryMaterialsDto) {
    const qb = this.materialRepo.createQueryBuilder('m');
    if (dto.keyword) {
      qb.andWhere('m.title LIKE :kw', { kw: `%${dto.keyword}%` });
    }
    if (dto.status) {
      qb.andWhere('m.status = :st', { st: dto.status });
    }
    qb.orderBy('m.updated_at', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [list, total] = await qb.getManyAndCount();
    return {
      list,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        total_pages: Math.ceil(total / dto.limit),
      },
    };
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepo.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException({ code: ErrorCode.MATERIAL_NOT_FOUND, message: '资料不存在' });
    }
    return material;
  }

  /**
   * 由上传文件信息生成展示用「文件信息」（如 PDF · 3.2MB）；
   * 扩展名优先取原始文件名，缺失时回落 file_url
   */
  private deriveFileMeta(
    fileName?: string,
    fileSize?: number,
    fileUrl?: string | null,
  ): string | null {
    const source = (fileName || fileUrl || '').split('?')[0];
    const ext = source.includes('.') ? (source.split('.').pop() || '').toUpperCase() : '';
    const parts: string[] = [];
    if (ext) parts.push(ext);
    if (fileSize !== undefined && fileSize !== null) parts.push(formatFileSize(fileSize));
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  /**
   * 由提交的文件列表生成存储用文件项：
   * 已存在的文件（file_url 相同且未携带新上传信息 file_size）保留原 file_meta，
   * 新上传的文件根据 file_name/file_size 生成
   */
  private buildFiles(
    dtoFiles: MaterialFileDto[],
    existing: MaterialFileItem[] | null,
  ): MaterialFileItem[] {
    const existingByUrl = new Map((existing || []).map((f) => [f.file_url, f]));
    return dtoFiles.map((f) => {
      const prev = existingByUrl.get(f.file_url);
      if (prev && f.file_size === undefined) {
        return { ...prev, file_name: f.file_name !== undefined ? f.file_name : prev.file_name };
      }
      return {
        file_url: f.file_url,
        file_name: f.file_name ?? null,
        file_meta: this.deriveFileMeta(f.file_name, f.file_size, f.file_url),
      };
    });
  }

  async create(dto: CreateMaterialDto): Promise<Material> {
    const { files, ...rest } = dto;
    const material = this.materialRepo.create(rest);
    material.files = files ? this.buildFiles(files, null) : null;
    return this.materialRepo.save(material);
  }

  async update(id: number, dto: UpdateMaterialDto): Promise<Material> {
    const { files, ...rest } = dto;
    const material = await this.findOne(id);
    Object.assign(material, rest);
    if (files !== undefined) {
      // null / [] 清空全部文件；数组则整体替换（保留未变文件的原文件信息）
      material.files = files && files.length > 0 ? this.buildFiles(files, material.files) : null;
    }
    return this.materialRepo.save(material);
  }

  async remove(id: number): Promise<null> {
    const material = await this.findOne(id);
    await this.materialRepo.remove(material);
    return null;
  }

  async updateStatus(id: number, status: CourseStatus): Promise<Material> {
    // 草稿仅为创建后的初始状态，不允许通过状态接口回退
    if (status === CourseStatus.DRAFT) {
      throw new BadRequestException({
        code: ErrorCode.PARAM_ERROR,
        message: '不能将状态设置为草稿',
      });
    }
    const material = await this.findOne(id);
    material.status = status;
    return this.materialRepo.save(material);
  }

  // ---------- 小程序端 ----------

  /** 资料 tab 列表：仅上架资料，游客可见 */
  async findMiniList(dto: QueryMiniMaterialsDto) {
    const qb = this.materialRepo
      .createQueryBuilder('m')
      .where('m.status = :on', { on: CourseStatus.ON });
    if (dto.keyword) {
      qb.andWhere('m.title LIKE :kw', { kw: `%${dto.keyword}%` });
    }
    qb.orderBy('m.created_at', 'DESC')
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [list, total] = await qb.getManyAndCount();
    return {
      list,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        total_pages: Math.ceil(total / dto.limit),
      },
    };
  }

  /** 资料详情：仅上架资料，游客可见（查看文件仍需登录取签名地址）；草稿不对外暴露 */
  async findMiniDetail(id: number): Promise<Material> {
    const material = await this.findOne(id);
    if (material.status === CourseStatus.DRAFT) {
      throw new NotFoundException({ code: ErrorCode.MATERIAL_NOT_FOUND, message: '资料不存在' });
    }
    if (material.status === CourseStatus.OFF) {
      throw new NotFoundException({ code: ErrorCode.MATERIAL_OFF_SHELF, message: '资料已下架' });
    }
    return material;
  }

  /** 下载地址：需登录；多文件按 index 指定；OSS 文件返回限时签名 URL，不暴露永久公开链接 */
  async getDownloadUrl(id: number, index = 0) {
    const material = await this.findOne(id);
    if (material.status === CourseStatus.DRAFT) {
      throw new NotFoundException({ code: ErrorCode.MATERIAL_NOT_FOUND, message: '资料不存在' });
    }
    if (material.status === CourseStatus.OFF) {
      throw new NotFoundException({ code: ErrorCode.MATERIAL_OFF_SHELF, message: '资料已下架' });
    }
    const files = material.files || [];
    if (files.length === 0) {
      throw new NotFoundException({
        code: ErrorCode.MATERIAL_NOT_FOUND,
        message: '资料文件尚未上传',
      });
    }
    const file = files[index];
    if (!file) {
      throw new NotFoundException({
        code: ErrorCode.MATERIAL_NOT_FOUND,
        message: '资料文件不存在',
      });
    }
    return {
      url: this.ossService.signGetUrl(file.file_url, DOWNLOAD_URL_EXPIRES_IN),
      expires_in: DOWNLOAD_URL_EXPIRES_IN,
    };
  }
}
