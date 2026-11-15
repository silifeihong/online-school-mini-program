import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileOptionCategory } from '../entities/profile-option.entity.js';

export class QueryProfileOptionsDto {
  @ApiPropertyOptional({ description: '按分类过滤' })
  @IsOptional()
  @IsEnum(ProfileOptionCategory)
  category?: ProfileOptionCategory;
}

export class CreateProfileOptionDto {
  @ApiProperty({ description: '所属分类', enum: ProfileOptionCategory })
  @IsEnum(ProfileOptionCategory)
  category: ProfileOptionCategory;

  @ApiProperty({ description: '选项名称（最多30个字）' })
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({ description: '排序值，非负整数，越小越靠前', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order: number;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

export class UpdateProfileOptionDto {
  @ApiPropertyOptional({ description: '所属分类', enum: ProfileOptionCategory })
  @IsOptional()
  @IsEnum(ProfileOptionCategory)
  category?: ProfileOptionCategory;

  @ApiPropertyOptional({ description: '选项名称（最多30个字）' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @ApiPropertyOptional({ description: '排序值，非负整数，越小越靠前' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
