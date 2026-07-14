import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
      code = `HTTP_${status}`;
      if (Array.isArray(message)) {
        details = message;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'APPLICATION_ERROR';
      this.logger.error(`${request.method} ${request.url}: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      message,
      error: { code, details },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
