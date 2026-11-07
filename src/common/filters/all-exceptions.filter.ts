import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error occurred';
    let errors: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, any>;
        message = errorObj.message || exception.message;
        errors = errorObj.errors || (Array.isArray(errorObj.message) ? errorObj.message : null);

        // If message is an array of validation errors, pick first as main message
        if (Array.isArray(message)) {
          message = message[0];
        }
      }
    } else if (exception instanceof Error) {
      // Mongoose CastError (e.g. invalid ObjectId)
      if (exception.name === 'CastError') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = `Invalid format for resource identifier`;
      } else if (exception.name === 'ValidationError') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = exception.message;
      } else if ((exception as any).code === 11000) {
        // Mongo duplicate key error
        statusCode = HttpStatus.CONFLICT;
        const keyPattern = (exception as any).keyPattern || {};
        const field = Object.keys(keyPattern).join(', ');
        message = `Duplicate resource error: A record with this ${field || 'value'} already exists`;
      } else {
        message = exception.message;
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${statusCode} - ${message}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

