import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ChapterContentType,
  CourseStatus,
  PaymentType,
} from '../../../common/enums/content.enums.js';

export class AdminQueryCoursesDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @IsOptional()
  @IsEnum(PaymentType)
  payment_type?: PaymentType;

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

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  teacher?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus)
  status: CourseStatus;
}

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ChapterContentType)
  content_type?: ChapterContentType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url?: string;

  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto) {}

export class SortChaptersDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
