import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseEnvelope } from '../interfaces/api-response.interface';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseEnvelope<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseEnvelope<T>> {
    const httpCtx = context.switchToHttp();
    const response = httpCtx.getResponse();
    const request = httpCtx.getRequest();

    // Skip wrapping for stream responses (e.g. AI SSE or downloads)
    const isStream = response.getHeader('Content-Type')?.toString().includes('text/event-stream');
    if (isStream) {
      return next.handle();
    }

    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((result) => {
        const statusCode = response.statusCode;

        // If result already formatted as envelope, pass through
        if (
          result &&
          typeof result === 'object' &&
          'success' in result &&
          'statusCode' in result
        ) {
          return result;
        }

        // Check if result has paginated structure { data, meta }
        let data = result;
        let meta: Record<string, any> | undefined = undefined;

        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'meta' in result
        ) {
          data = result.data;
          meta = result.meta;
        }

        return {
          success: true,
          statusCode,
          message: customMessage || 'Operation completed successfully',
          data: data ?? null,
          ...(meta ? { meta } : {}),
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}

