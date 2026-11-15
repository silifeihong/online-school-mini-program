import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateSalesWechatDto {
  @ApiProperty({ description: '销售微信号' })
  @IsString()
  @MaxLength(50)
  sales_wechat: string;
}
