import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { UploadService } from './upload.service';
import type { MulterFile } from './multer-file.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Roles('school_admin', 'principal', 'teacher', 'hr')
  @UseInterceptors(FileInterceptor('file', { storage: undefined, limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: MulterFile,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId?: string,
    @Body('category') category?: string,
    @Body('description') description?: string,
  ) {
    return this.uploadService.upload(
      tenantId,
      user.sub,
      file,
      entityType,
      entityId,
      category,
      description,
    );
  }

  @Get()
  @Roles('school_admin', 'principal', 'teacher', 'hr', 'student', 'parent')
  async findAll(
    @TenantId() tenantId: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.uploadService.findAll(tenantId, entityType, entityId);
  }

  @Get(':id')
  @Roles('school_admin', 'principal', 'teacher', 'hr', 'student', 'parent')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.uploadService.findOne(id, tenantId);
  }

  @Get(':id/download')
  @Roles('school_admin', 'principal', 'teacher', 'hr', 'student', 'parent')
  async download(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ) {
    const { doc, filePath } = await this.uploadService.download(id, tenantId);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    res.sendFile(path.resolve(filePath));
  }

  @Delete(':id')
  @Roles('school_admin', 'principal', 'teacher', 'hr')
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.uploadService.remove(id, tenantId);
  }
}
