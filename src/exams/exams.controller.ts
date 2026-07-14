import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto, SubmitMarksDto } from './dto/exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles('school_admin', 'exam_controller', 'principal')
  create(@TenantId() tenantId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'exam_controller', 'student', 'parent')
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.examsService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      classId,
      subjectId,
      type,
      status,
    );
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'exam_controller', 'student', 'parent')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.examsService.findOne(tenantId, id);
  }

  @Get(':id/results')
  @Roles('school_admin', 'principal', 'teacher', 'exam_controller', 'student', 'parent')
  getResults(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.examsService.getResults(tenantId, id);
  }

  @Post(':id/marks')
  @Roles('school_admin', 'teacher', 'exam_controller')
  submitMarks(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: SubmitMarksDto) {
    return this.examsService.submitMarks(tenantId, id, dto);
  }

  @Patch(':id')
  @Roles('school_admin', 'exam_controller')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'exam_controller')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.examsService.remove(tenantId, id);
  }
}
