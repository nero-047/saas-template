import { Injectable, NestMiddleware } from '@nestjs/common';

import type { ContextCarrierRequest } from './request-context';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(
    request: ContextCarrierRequest,
    _response: unknown,
    next: () => void,
  ): void {
    this.context.run(request, next);
  }
}
