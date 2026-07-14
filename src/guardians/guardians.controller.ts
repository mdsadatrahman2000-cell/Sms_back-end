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
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto, UpdateGuardianDto } from './dto/guardian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('guardians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post()
  @Roles('school_admin', 'principal', 'hr', 'parent')
  async create(@TenantId() tenantId: string, @Body() dto: CreateGuardianDto) {
    return this.guardiansService.create(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'parent')
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.guardiansService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'parent')
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.guardiansService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('school_admin', 'principal', 'hr')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGuardianDto,
  ) {
    return this.guardiansService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('school_admin', 'principal', 'hr')
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.guardiansService.remove(tenantId, id);
  }

  @Post(':id/link/:studentId')
  @Roles('school_admin', 'principal')
  async linkStudent(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.guardiansService.linkStudent(tenantId, id, studentId);
  }

  @Delete(':id/unlink/:studentId')
  @Roles('school_admin', 'principal')
  async unlinkStudent(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.guardiansService.unlinkStudent(tenantId, id, studentId);
  }
}
