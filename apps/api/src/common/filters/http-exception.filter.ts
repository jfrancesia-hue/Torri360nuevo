import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message as string || exception.message;
      code = exception.constructor.name.toUpperCase().replace('EXCEPTION', '');
      details = exceptionResponse;
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = exception.message || 'Error interno del servidor';
      details = { error: exception.message, stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined };
    }

    this.logger.warn(
      `[${status}] ${code} - ${request.method} ${request.url} - ${message}`,
    );

    response.status(status).json({
      data: null,
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && { details }),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
