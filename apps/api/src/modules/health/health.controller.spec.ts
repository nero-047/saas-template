import { ServiceUnavailableException } from '@nestjs/common';

import { DatabaseHealthIndicator } from './database-health.indicator';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  const database = {
    check: jest.fn<Promise<boolean>, []>(),
  };
  const service = new HealthService(
    database as unknown as DatabaseHealthIndicator,
  );
  const controller = new HealthController(service);

  beforeEach(() => {
    database.check.mockReset();
  });

  it('reports liveness without checking external dependencies', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
    expect(database.check).not.toHaveBeenCalled();
  });

  it('reports readiness when PostgreSQL is reachable', async () => {
    database.check.mockResolvedValue(true);

    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
      checks: { database: 'up' },
    });
  });

  it('returns a safe 503 response when PostgreSQL is unavailable', async () => {
    database.check.mockResolvedValue(false);

    expect.assertions(3);
    try {
      await controller.getReadiness();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      if (!(error instanceof ServiceUnavailableException)) {
        return;
      }
      expect(error.getStatus()).toBe(503);
      expect(error.getResponse()).toEqual({
        status: 'unavailable',
        checks: { database: 'down' },
      });
    }
  });
});
