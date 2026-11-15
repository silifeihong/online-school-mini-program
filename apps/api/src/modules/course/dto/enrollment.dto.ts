import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

class PageDto {
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

export class QueryEnrolledStudentsDto extends PageDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;
}

export class QueryCandidateStudentsDto extends PageDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  major?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  university?: string;
}

export class BatchAddStudentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  user_ids: number[];
}
