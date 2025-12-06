/**
 * Health Check Controller
 */

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'payments-microservice',
    };
  }
}

