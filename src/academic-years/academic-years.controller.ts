import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';

@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @Roles('school_admin', 'principal')
  create(@Body() dto: CreateAcademicYearDto, @TenantId() tenantId: string) {
    return this.academicYearsService.create(dto, tenantId);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'student', 'parent')
  findAll(@TenantId() tenantId: string) {
    return this.academicYearsService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'student', 'parent')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.academicYearsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicYearDto, @TenantId() tenantId: string) {
    return this.academicYearsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal')
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.academicYearsService.remove(id, tenantId);
  }

  @Post(':id/set-current')
  @Roles('school_admin', 'principal')
  setCurrent(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.academicYearsService.setCurrent(id, tenantId);
  }
}
