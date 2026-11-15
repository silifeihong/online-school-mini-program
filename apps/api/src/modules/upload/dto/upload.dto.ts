import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UPLOAD_KINDS } from '../upload.service.js';
import type { UploadKind } from '../upload.service.js';

export class UploadStsDto {
  @ApiProperty({
    description: '上传类别：cover=封面 video=课件视频 document=文档课件 material=资料文件',
    enum: Object.keys(UPLOAD_KINDS),
  })
  @IsIn(Object.keys(UPLOAD_KINDS) as UploadKind[])
  kind: UploadKind;
}
