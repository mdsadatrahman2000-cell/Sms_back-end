import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('school_admin', 'principal', 'hr')
  async create(@TenantId() tenantId: string, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'hr')
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'student', 'parent')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'hr')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal', 'hr')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.remove(tenantId, id);
  }
}
