import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { CreateHostelDto, CreateRoomDto, AssignRoomDto } from './dto/hostel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('hostel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Post()
  @Roles('school_admin', 'hostel_manager')
  createHostel(@TenantId() tenantId: string, @Body() dto: CreateHostelDto) {
    return this.hostelService.createHostel(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'hostel_manager', 'teacher')
  getHostels(@TenantId() tenantId: string) {
    return this.hostelService.getHostels(tenantId);
  }

  @Get(':id')
  @Roles('school_admin', 'hostel_manager')
  getHostel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.hostelService.getHostel(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'hostel_manager')
  updateHostel(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.hostelService.updateHostel(tenantId, id, data);
  }

  @Delete(':id')
  @Roles('school_admin', 'hostel_manager')
  deleteHostel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.hostelService.deleteHostel(tenantId, id);
  }

  @Post('rooms')
  @Roles('school_admin', 'hostel_manager')
  createRoom(@TenantId() tenantId: string, @Body() dto: CreateRoomDto) {
    return this.hostelService.createRoom(tenantId, dto);
  }

  @Get('rooms')
  @Roles('school_admin', 'hostel_manager')
  getRooms(@TenantId() tenantId: string, @Query('hostelId') hostelId?: string) {
    return this.hostelService.getRooms(tenantId, hostelId);
  }

  @Post('assign')
  @Roles('school_admin', 'hostel_manager')
  assignRoom(@TenantId() tenantId: string, @Body() dto: AssignRoomDto) {
    return this.hostelService.assignRoom(tenantId, dto);
  }

  @Delete('unassign/:allocationId')
  @Roles('school_admin', 'hostel_manager')
  unassignRoom(@TenantId() tenantId: string, @Param('allocationId') allocationId: string) {
    return this.hostelService.unassignRoom(tenantId, allocationId);
  }
}
