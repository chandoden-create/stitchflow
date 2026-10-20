import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'API and Database Health check' })
  async getHealth() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'StitchFlow Backend API',
      database: dbStatus,
    };
  }

  @Get()
  getRoot() {
    return {
      name: 'StitchFlow API',
      version: '1.0.0',
      description: 'Premium Tailoring Business Management Mobile Backend',
      docs: '/api/docs',
    };
  }
}
