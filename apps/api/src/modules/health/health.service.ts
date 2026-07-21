import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { DatabaseHealthIndicator } from './database-health.indicator';

const LIVE_RESPONSE = { status: 'ok' } as const;
const READY_RESPONSE = {
  status: 'ready',
  checks: { database: 'up' },
} as const;
const UNAVAILABLE_RESPONSE = {
  status: 'unavailable',
  checks: { database: 'down' },
} as const;

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseHealthIndicator) {}

  getHealth() {
    return LIVE_RESPONSE;
  }

  async getReadiness() {
    if (await this.database.check()) {
      return READY_RESPONSE;
    }

    throw new ServiceUnavailableException(UNAVAILABLE_RESPONSE);
  }
}
