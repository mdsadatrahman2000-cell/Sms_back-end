import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
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
}
