import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, ErrorMessages } from '@online-school/shared-types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.UNKNOWN_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      // HTTP 状态 → 业务错误码默认映射（res.code 显式指定时优先）
      const statusCodeMap: Record<number, ErrorCode> = {
        [HttpStatus.BAD_REQUEST]: ErrorCode.PARAM_ERROR,
        [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
        [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
        [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
      };
      code = statusCodeMap[status] || code;

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, any>;
        message = res.message || exception.message;
        code = res.code || code;
      }

      // Handle class-validator errors
      if (Array.isArray(message)) {
        message = message.join('; ');
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    });
  }
}
