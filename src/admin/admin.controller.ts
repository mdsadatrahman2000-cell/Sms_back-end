import { Controller, Post, Get, Logger } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post('seed')
  async seed() {
    this.logger.log('Seed endpoint called');
    return this.adminService.seed();
  }

  @Get('seed-status')
  async getSeedStatus() {
    return this.adminService.getSeedStatus();
  }
}
