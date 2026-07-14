import { Controller, Get, Delete, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GdprService } from './gdpr.service';

@ApiTags('gdpr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gdpr')
export class GdprController {
  constructor(private readonly service: GdprService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all user data (GDPR Article 20)' })
  async exportData(@Req() req: any, @Res() res: any) {
    const data = await this.service.exportUserData(req.user.tenantId, req.user.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user.id}.json"`);
    res.json(data);
  }

  @Delete('forget')
  @HttpCode(200)
  @ApiOperation({ summary: 'Right to be forgotten (GDPR Article 17)' })
  async forgetMe(@Req() req: any) {
    return this.service.deleteUserData(req.user.tenantId, req.user.id);
  }
}
