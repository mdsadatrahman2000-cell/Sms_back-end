import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@TenantId() tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }

  @Get('recent-activity')
  async getRecentActivity(@TenantId() tenantId: string) {
    return this.dashboardService.getRecentActivity(tenantId);
  }

  @Get('upcoming-events')
  async getUpcomingEvents(@TenantId() tenantId: string) {
    return this.dashboardService.getUpcomingEvents(tenantId);
  }
}
