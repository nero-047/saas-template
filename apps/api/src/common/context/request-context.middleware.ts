import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestIdSchema } from '@saas-template/validation';

import type { ContextCarrierRequest } from './request-context';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(
    request: ContextCarrierRequest,
    response: { setHeader(name: string, value: string): unknown },
    next: () => void,
  ): void {
    const incomingRequestId = request.headers?.['x-request-id'];
    const parsedRequestId = requestIdSchema.safeParse(incomingRequestId);
    const requestId = parsedRequestId.success
      ? parsedRequestId.data
      : randomUUID();

    response.setHeader('X-Request-ID', requestId);
    this.context.run(request, next, requestId);
  }
}
