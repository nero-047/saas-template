import { randomUUID } from 'node:crypto';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  API_ERROR_CODES,
  type ApiErrorCode,
  type ApiErrorResponse,
} from '@saas-template/validation';

import type { ContextCarrierRequest } from '../context/request-context';
import { RequestContextService } from '../context/request-context.service';
import type { CodedApiException } from './api-http.exceptions';

interface HttpResponse {
  setHeader(name: string, value: string): unknown;
  status(statusCode: number): HttpResponse;
  json(body: ApiErrorResponse): unknown;
}

interface ErrorDescriptor {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly message: string;
}

const ERROR_MESSAGES: Readonly<Record<ApiErrorCode, string>> = {
  [API_ERROR_CODES.AUTH_REQUIRED]: 'Authentication is required.',
  [API_ERROR_CODES.INVALID_CREDENTIALS]: 'Email or password is invalid.',
  [API_ERROR_CODES.FORBIDDEN]: 'Access is forbidden.',
  [API_ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Request validation failed.',
  [API_ERROR_CODES.CONFLICT]: 'The request conflicts with existing data.',
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 'The service is unavailable.',
  [API_ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred.',
};

function isCodedApiException(
  exception: HttpException,
): exception is HttpException & CodedApiException {
  return (
    'errorCode' in exception &&
    Object.values(API_ERROR_CODES).includes(
      (exception as Partial<CodedApiException>).errorCode as ApiErrorCode,
    )
  );
}

function httpErrorDescriptor(exception: HttpException): ErrorDescriptor {
  const status = exception.getStatus();
  if (isCodedApiException(exception)) {
    return {
      status,
      code: exception.errorCode,
      message: ERROR_MESSAGES[exception.errorCode],
    };
  }

  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return {
        status,
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
      };
    case HttpStatus.UNAUTHORIZED:
      return {
        status,
        code: API_ERROR_CODES.AUTH_REQUIRED,
        message: ERROR_MESSAGES.AUTH_REQUIRED,
      };
    case HttpStatus.FORBIDDEN:
      return {
        status,
        code: API_ERROR_CODES.FORBIDDEN,
        message: ERROR_MESSAGES.FORBIDDEN,
      };
    case HttpStatus.NOT_FOUND:
      return {
        status,
        code: API_ERROR_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND,
      };
    case HttpStatus.CONFLICT:
      return {
        status,
        code: API_ERROR_CODES.CONFLICT,
        message: ERROR_MESSAGES.CONFLICT,
      };
    case HttpStatus.SERVICE_UNAVAILABLE:
      return {
        status,
        code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
        message: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      };
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<ContextCarrierRequest>();
    const response = http.getResponse<HttpResponse>();
    const requestId = this.resolveRequestId(request);
    const descriptor =
      exception instanceof HttpException
        ? httpErrorDescriptor(exception)
        : {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            code: API_ERROR_CODES.INTERNAL_ERROR,
            message: ERROR_MESSAGES.INTERNAL_ERROR,
          };

    if (!(exception instanceof HttpException)) {
      const errorType = exception instanceof Error ? exception.name : 'Unknown';
      this.logger.error(
        `Unhandled API error (${errorType}); requestId=${requestId}`,
      );
    }

    const body: ApiErrorResponse = {
      error: {
        code: descriptor.code,
        message: descriptor.message,
      },
      requestId,
    };
    response.setHeader('X-Request-ID', requestId);
    response.status(descriptor.status).json(body);
  }

  private resolveRequestId(request: ContextCarrierRequest): string {
    try {
      return this.requestContext.get().requestId;
    } catch {
      return request.requestContext?.requestId ?? randomUUID();
    }
  }
}
