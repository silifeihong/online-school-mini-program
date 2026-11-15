import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourseStatus } from '../../../common/enums/content.enums.js';

export class AdminQueryMaterialsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}

/**
 * 上传文件项：file_meta 不接受前端直接编辑，由后端根据上传文件的
 * 原始文件名与大小生成（file_name / file_size 由前端从上传结果带回）
 */
export class MaterialFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  file_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  file_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  file_size?: number;
}

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_url?: string | null;

  // 多文件列表：整体替换；null / [] 表示清空全部文件，缺省表示不变
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => MaterialFileDto)
  files?: MaterialFileDto[] | null;

  // 图文内容（富文本 HTML）：选填；null 表示清空，缺省表示不变
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  content?: string | null;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}

export class UpdateMaterialStatusDto {
  @IsEnum(CourseStatus)
  status: CourseStatus;
}

/** 小程序下载地址查询：多文件按 index 指定第几个文件 */
export class MiniDownloadUrlQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  index?: number = 0;
}

export class QueryMiniMaterialsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
