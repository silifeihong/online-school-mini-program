import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '../../../common/enums/user-status.enum.js';

export class FindAllStudentsDto {
  @ApiPropertyOptional({ description: '搜索关键词（邮箱/昵称）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '状态过滤' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: '年级过滤' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '专业过滤' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ description: '院校过滤' })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class UpdateStudentStatusDto {
  @ApiProperty({ description: '状态', enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码（8-20位，包含字母和数字）' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
