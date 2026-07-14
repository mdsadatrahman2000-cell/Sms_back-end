import { Controller, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get()
  @Roles('school_admin', 'hr')
  findAll(@TenantId() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('department') department?: string, @Query('status') status?: string) {
    return this.hrService.findAll(tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, department, status);
  }

  @Get('payroll/summary')
  @Roles('school_admin', 'hr', 'accountant')
  getPayrollSummary(@TenantId() tenantId: string, @Query('month') month: string) {
    return this.hrService.getPayrollSummary(tenantId, month);
  }

  @Get(':id')
  @Roles('school_admin', 'hr', 'teacher')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.hrService.findOne(tenantId, id);
  }
}
