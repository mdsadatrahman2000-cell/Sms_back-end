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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles('school_admin', 'principal', 'hr')
  async create(@TenantId() tenantId: string, @Body() dto: CreateTeacherDto) {
    return this.teachersService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'hr')
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.teachersService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'hr')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.teachersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal', 'hr')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal', 'hr')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.teachersService.remove(tenantId, id);
  }
}
