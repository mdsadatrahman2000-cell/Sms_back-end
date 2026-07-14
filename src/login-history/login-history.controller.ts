import { Controller, Get, Query, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoginHistoryService } from './login-history.service';

@ApiTags('login-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('login-history')
export class LoginHistoryController {
  constructor(private readonly service: LoginHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all login history (admin)' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(req.user.tenantId, +(page || 1), +(limit || 50));
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get login history for a user' })
  findByUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByUser(req.user.tenantId, userId, +(page || 1), +(limit || 50));
  }
}
