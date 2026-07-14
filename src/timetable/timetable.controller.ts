import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto, BulkCreateTimetableDto, UpdateTimetableSlotDto } from './dto/timetable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @Roles('school_admin', 'principal', 'teacher')
  createSlot(@TenantId() tenantId: string, @Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.createSlot(tenantId, dto);
  }

  @Post('bulk')
  @Roles('school_admin', 'principal')
  bulkCreate(@TenantId() tenantId: string, @Body() dto: BulkCreateTimetableDto) {
    return this.timetableService.bulkCreate(tenantId, dto);
  }

  @Get('class/:classId')
  getByClass(@TenantId() tenantId: string, @Param('classId') classId: string) {
    return this.timetableService.getByClass(tenantId, classId);
  }

  @Get('teacher/:teacherId')
  getByTeacher(@TenantId() tenantId: string, @Param('teacherId') teacherId: string) {
    return this.timetableService.getByTeacher(tenantId, teacherId);
  }

  @Get('my')
  getMyTimetable(@TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.timetableService.getByTeacher(tenantId, user.id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal', 'teacher')
  updateSlot(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateTimetableSlotDto) {
    return this.timetableService.updateSlot(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal', 'teacher')
  deleteSlot(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.timetableService.deleteSlot(tenantId, id);
  }

  @Delete('class/:classId')
  @Roles('school_admin', 'principal')
  deleteByClass(@TenantId() tenantId: string, @Param('classId') classId: string) {
    return this.timetableService.deleteByClass(tenantId, classId);
  }
}
