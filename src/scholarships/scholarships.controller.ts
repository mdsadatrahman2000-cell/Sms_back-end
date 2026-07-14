import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { CreateScholarshipDto, ApplyScholarshipDto } from './dto/scholarship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('scholarships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @Post()
  @Roles('school_admin', 'accountant')
  create(@TenantId() tenantId: string, @Body() dto: CreateScholarshipDto) {
    return this.scholarshipsService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'accountant', 'teacher')
  findAll(@TenantId() tenantId: string) {
    return this.scholarshipsService.findAll(tenantId);
  }

  @Post(':id/apply')
  @Roles('school_admin', 'accountant')
  apply(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: ApplyScholarshipDto) {
    return this.scholarshipsService.apply(tenantId, id, dto);
  }

  @Delete(':id/unapply/:studentId')
  @Roles('school_admin', 'accountant')
  unapply(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.scholarshipsService.unapply(id, studentId);
  }
}
