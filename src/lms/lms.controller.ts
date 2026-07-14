import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LmsService } from './lms.service';
import { CreateCourseDto, UpdateCourseDto, CreateModuleDto, CreateLessonDto, CreateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto } from './dto/lms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Post('courses')
  @Roles('school_admin', 'teacher')
  createCourse(@TenantId() tenantId: string, @Body() dto: CreateCourseDto) {
    return this.lmsService.createCourse(tenantId, dto);
  }

  @Get('courses')
  getCourses(@TenantId() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.lmsService.getCourses(tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @Get('courses/:id')
  getCourse(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.lmsService.getCourse(tenantId, id);
  }

  @Patch('courses/:id')
  @Roles('school_admin', 'teacher')
  updateCourse(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.lmsService.updateCourse(tenantId, id, dto);
  }

  @Delete('courses/:id')
  @Roles('school_admin', 'teacher')
  deleteCourse(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.lmsService.deleteCourse(tenantId, id);
  }

  @Post('courses/:courseId/modules')
  @Roles('school_admin', 'teacher')
  addModule(@TenantId() tenantId: string, @Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.lmsService.addModule(tenantId, courseId, dto);
  }

  @Patch('modules/:moduleId')
  @Roles('school_admin', 'teacher')
  updateModule(@TenantId() tenantId: string, @Param('moduleId') moduleId: string, @Body() data: any) {
    return this.lmsService.updateModule(tenantId, moduleId, data);
  }

  @Delete('modules/:moduleId')
  @Roles('school_admin', 'teacher')
  deleteModule(@Param('moduleId') moduleId: string) {
    return this.lmsService.deleteModule(moduleId);
  }

  @Post('modules/:moduleId/lessons')
  @Roles('school_admin', 'teacher')
  addLesson(@TenantId() tenantId: string, @Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.lmsService.addLesson(tenantId, moduleId, dto);
  }

  @Patch('lessons/:lessonId')
  @Roles('school_admin', 'teacher')
  updateLesson(@Param('lessonId') lessonId: string, @Body() data: any) {
    return this.lmsService.updateLesson(lessonId, data);
  }

  @Delete('lessons/:lessonId')
  @Roles('school_admin', 'teacher')
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.lmsService.deleteLesson(lessonId);
  }

  @Post('assignments')
  @Roles('school_admin', 'teacher')
  createAssignment(@TenantId() tenantId: string, @Body() dto: CreateAssignmentDto) {
    return this.lmsService.createAssignment(tenantId, dto);
  }

  @Get('assignments')
  getAssignments(@TenantId() tenantId: string, @Query('classId') classId?: string) {
    return this.lmsService.getAssignments(tenantId, classId);
  }

  @Get('assignments/:id')
  getAssignment(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.lmsService.getAssignment(tenantId, id);
  }

  @Post('assignments/:assignmentId/submit')
  @Roles('student')
  submitAssignment(@TenantId() tenantId: string, @Param('assignmentId') assignmentId: string, @CurrentUser() user: any, @Body() dto: SubmitAssignmentDto) {
    return this.lmsService.submitAssignment(tenantId, assignmentId, user.id, dto);
  }

  @Post('submissions/:submissionId/grade')
  @Roles('school_admin', 'teacher')
  gradeSubmission(@TenantId() tenantId: string, @Param('submissionId') submissionId: string, @Body() dto: GradeSubmissionDto) {
    return this.lmsService.gradeSubmission(tenantId, submissionId, dto);
  }
}
