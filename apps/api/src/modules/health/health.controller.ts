import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  getHealth() {
    return this.health.getHealth();
  }

  @Get('ready')
  getReadiness() {
    return this.health.getReadiness();
  }
}
