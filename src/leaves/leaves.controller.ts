import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @Roles('teacher', 'hr', 'accountant')
  apply(@TenantId() tenantId: string, @CurrentUser() user: any, @Body() dto: CreateLeaveDto) {
    return this.leavesService.apply(tenantId, user.id, dto);
  }

  @Get()
  @Roles('school_admin', 'teacher', 'hr', 'principal')
  findAll(@TenantId() tenantId: string, @CurrentUser() user: any) {
    const isAdmin = ['school_admin', 'principal'].includes(user.role);
    return this.leavesService.findAll(tenantId, isAdmin ? undefined : user.id);
  }

  @Patch(':id/approve')
  @Roles('school_admin', 'principal')
  approve(@TenantId() tenantId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.leavesService.approve(tenantId, id, user.id);
  }

  @Patch(':id/reject')
  @Roles('school_admin', 'principal')
  reject(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leavesService.reject(tenantId, id);
  }
}
