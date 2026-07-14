import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('school_admin')
  create(@TenantId() tenantId: string, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto, tenantId);
  }

  @Get()
  @Roles('school_admin')
  findAll(@TenantId() tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get('permissions')
  @Roles('school_admin')
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get(':id')
  @Roles('school_admin')
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('school_admin')
  update(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('school_admin')
  remove(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id, tenantId);
  }
}
