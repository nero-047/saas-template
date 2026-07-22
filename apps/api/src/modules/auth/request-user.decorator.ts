import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from './authenticated-request';
import type { CurrentUser } from './current-user';

export const RequestUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.currentUser) {
      throw new Error('SessionGuard did not establish the request user.');
    }
    return request.currentUser;
  },
);
