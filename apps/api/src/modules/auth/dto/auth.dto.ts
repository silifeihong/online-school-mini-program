import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class SendEmailCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

export class VerifyEmailCodeDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6位验证码', example: '123456' })
  @IsString()
  @Length(6, 6, { message: '验证码为6位数字' })
  code: string;
}

export class RegisterDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '邮箱验证码' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ description: '密码（8-20位，包含字母和数字）', example: 'Password123' })
  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须包含字母和数字',
  })
  password: string;

  @ApiPropertyOptional({ description: '昵称（可选，默认为邮箱前缀）' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ description: '兼容旧客户端：接收但忽略，注册不再自动关联微信' })
  @IsOptional()
  @IsString()
  wx_code?: string;
}

export class LoginDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string;
}

export class WechatLoginDto {
  @ApiProperty({ description: '微信code' })
  @IsString()
  wx_code: string;
}

export class WechatBindEmailDto {
  @ApiProperty({ description: '微信 openid（wechat-login 返回 needBindEmail 时下发；wx code 一次性，不可二次换取）' })
  @IsString()
  @MaxLength(255)
  wx_openid: string;

  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '邮箱验证码' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiPropertyOptional({ description: '密码（邮箱未注册时必填；已注册未绑微信的关联模式不需要）' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须包含字母和数字',
  })
  password?: string;

  @ApiProperty({ description: '昵称（缺省用邮箱前缀）' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nickname?: string;
}

export class SendWechatBindCodeDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '验证码' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须包含字母和数字',
  })
  new_password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token' })
  @IsString()
  refresh_token: string;
}

export class CheckEmailDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}
