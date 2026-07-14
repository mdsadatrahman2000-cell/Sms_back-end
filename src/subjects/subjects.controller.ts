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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles('school_admin', 'principal')
  async create(@TenantId() tenantId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(tenantId, dto);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.subjectsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.subjectsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.subjectsService.remove(tenantId, id);
  }
}
