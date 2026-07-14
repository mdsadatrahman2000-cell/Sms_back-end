import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/admission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @Roles('school_admin')
  create(@TenantId() tenantId: string, @Body() dto: CreateAdmissionDto) {
    return this.admissionsService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin')
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.admissionsService.findAll(tenantId, status);
  }

  @Patch(':id/status')
  @Roles('school_admin')
  updateStatus(@TenantId() tenantId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.admissionsService.updateStatus(tenantId, id, status);
  }
}
