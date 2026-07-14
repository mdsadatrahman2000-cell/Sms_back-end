import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateRouteDto, AssignStudentDto } from './dto/transport.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('routes')
  @Roles('school_admin', 'transport_manager')
  createRoute(@TenantId() tenantId: string, @Body() dto: CreateRouteDto) {
    return this.transportService.createRoute(tenantId, dto);
  }

  @Get('routes')
  @Roles('school_admin', 'transport_manager', 'teacher')
  getRoutes(@TenantId() tenantId: string) {
    return this.transportService.getRoutes(tenantId);
  }

  @Get('routes/:id')
  @Roles('school_admin', 'transport_manager')
  getRoute(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transportService.getRoute(tenantId, id);
  }

  @Patch('routes/:id')
  @Roles('school_admin', 'transport_manager')
  updateRoute(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.transportService.updateRoute(tenantId, id, data);
  }

  @Delete('routes/:id')
  @Roles('school_admin', 'transport_manager')
  deleteRoute(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transportService.deleteRoute(tenantId, id);
  }

  @Post('assign')
  @Roles('school_admin', 'transport_manager')
  assignStudent(@TenantId() tenantId: string, @Body() dto: AssignStudentDto) {
    return this.transportService.assignStudent(tenantId, dto);
  }

  @Delete('unassign/:studentId')
  @Roles('school_admin', 'transport_manager')
  unassignStudent(@TenantId() tenantId: string, @Param('studentId') studentId: string) {
    return this.transportService.unassignStudent(tenantId, studentId);
  }
}
