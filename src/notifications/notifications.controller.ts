import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, CreateNoticeDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('school_admin', 'principal', 'teacher')
  createNotification(@TenantId() tenantId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(tenantId, dto);
  }

  @Get()
  getNotifications(@TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.getNotifications(tenantId, user.id);
  }

  @Get('unread-count')
  getUnreadCount(@TenantId() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(tenantId, user.id);
  }

  @Post(':messageId/read')
  markAsRead(@TenantId() tenantId: string, @Param('messageId') messageId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(tenantId, messageId, user.id);
  }

  @Post('notices')
  @Roles('school_admin', 'principal')
  createNotice(@TenantId() tenantId: string, @Body() dto: CreateNoticeDto) {
    return this.notificationsService.createNotice(tenantId, dto);
  }

  @Get('notices')
  getNotices(@TenantId() tenantId: string) {
    return this.notificationsService.getNotices(tenantId);
  }

  @Delete('notices/:id')
  @Roles('school_admin', 'principal')
  deleteNotice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.notificationsService.deleteNotice(tenantId, id);
  }
}
