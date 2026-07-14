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
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('school_admin', 'principal')
  async create(@TenantId() tenantId: string, @Body() dto: CreateClassDto) {
    return this.classesService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'student', 'parent')
  async findAll(@TenantId() tenantId: string) {
    return this.classesService.findAll(tenantId);
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'class_teacher', 'student', 'parent')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classesService.remove(tenantId, id);
  }
}
