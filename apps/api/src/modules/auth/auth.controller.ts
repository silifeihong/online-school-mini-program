import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  SendEmailCodeDto,
  RegisterDto,
  LoginDto,
  WechatLoginDto,
  WechatBindEmailDto,
  SendWechatBindCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  CheckEmailDto,
} from './dto/auth.dto.js';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-email-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码已发送' })
  sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return this.authService.sendEmailCode(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邮箱注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '账号密码登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('wechat-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信一键登录' })
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto);
  }

  @Post('wechat-bind-send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信绑定邮箱-发送验证码（返回 registered 区分关联/新建）' })
  sendWechatBindCode(@Body() dto: SendWechatBindCodeDto) {
    return this.authService.sendWechatBindCode(dto);
  }

  @Post('wechat-bind-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信绑定邮箱（已注册未绑微信=关联；未注册=新建）' })
  wechatBindEmail(@Body() dto: WechatBindEmailDto) {
    return this.authService.wechatBindEmail(dto);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '检查邮箱是否已注册（确认账号页）' })
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '忘记密码-发送验证码' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }
}
