import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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

  @Post('assign')
  @Roles('school_admin', 'transport_manager')
  assignStudent(@TenantId() tenantId: string, @Body() dto: AssignStudentDto) {
    return this.transportService.assignStudent(tenantId, dto);
  }

  @Get('routes/:routeId/students')
  @Roles('school_admin', 'transport_manager')
  getRouteStudents(@TenantId() tenantId: string, @Param('routeId') routeId: string) {
    return this.transportService.getRouteStudents(tenantId, routeId);
  }
}
