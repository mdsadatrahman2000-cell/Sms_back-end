import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('report-card/:studentId')
  @Roles('school_admin', 'teacher', 'parent', 'student')
  getReportCard(@TenantId() tenantId: string, @Param('studentId') studentId: string) {
    return this.reportsService.getReportCard(tenantId, studentId);
  }

  @Get('class-rankings/:classId')
  @Roles('school_admin', 'teacher')
  getClassRankings(@TenantId() tenantId: string, @Param('classId') classId: string) {
    return this.reportsService.getClassRankings(tenantId, classId);
  }

  @Get('attendance-summary/:studentId')
  @Roles('school_admin', 'teacher', 'parent', 'student')
  getAttendanceSummary(@TenantId() tenantId: string, @Param('studentId') studentId: string) {
    return this.reportsService.getAttendanceSummary(tenantId, studentId);
  }
}
