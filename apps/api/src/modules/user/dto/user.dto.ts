import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称（不传则不修改）' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  nickname?: string;

  @ApiProperty({ description: '当前年级' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @ApiProperty({ description: '所学专业' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  major: string;

  @ApiProperty({ description: '所属院校' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  university: string;
}
