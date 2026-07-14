import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkCreateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @Roles('school_admin', 'teacher', 'class_teacher')
  create(@TenantId() tenantId: string, @Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(tenantId, dto);
  }

  @Post('bulk')
  @Roles('school_admin', 'teacher', 'class_teacher')
  bulkCreate(@TenantId() tenantId: string, @Body() dto: BulkCreateAttendanceDto) {
    return this.attendancesService.bulkCreate(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'parent')
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('classId') classId?: string,
    @Query('date') date?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendancesService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      classId,
      date,
      studentId,
    );
  }

  @Get('student/:studentId')
  @Roles('school_admin', 'principal', 'teacher', 'parent', 'student')
  getByStudent(@TenantId() tenantId: string, @Param('studentId') studentId: string, @Query('month') month?: string) {
    return this.attendancesService.getByStudent(tenantId, studentId, month);
  }

  @Get('class/:classId')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher')
  getByClass(@TenantId() tenantId: string, @Param('classId') classId: string, @Query('date') date: string) {
    return this.attendancesService.getByClass(tenantId, classId, date);
  }

  @Get('summary/:classId')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher')
  getSummary(@TenantId() tenantId: string, @Param('classId') classId: string, @Query('month') month: string) {
    return this.attendancesService.getSummary(tenantId, classId, month);
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.attendancesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'teacher', 'class_teacher')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(tenantId, id, dto);
  }
}
