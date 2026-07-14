import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, CreateNoticeDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(tenantId: string, dto: CreateNotificationDto) {
    const recipientIds = dto.recipientIds || [];

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        senderId: '',
        subject: dto.title,
        content: dto.message,
        recipients: {
          create: recipientIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: { recipients: true },
    });

    return message;
  }

  async getNotifications(tenantId: string, userId: string) {
    return this.prisma.messageRecipient.findMany({
      where: {
        userId,
        message: { tenantId },
      },
      include: {
        message: { select: { id: true, subject: true, content: true, createdAt: true } },
      },
      orderBy: { message: { createdAt: 'desc' } },
    });
  }

  async markAsRead(tenantId: string, messageId: string, userId: string) {
    return this.prisma.messageRecipient.update({
      where: {
        messageId_userId: { messageId, userId },
      },
      data: { readAt: new Date() },
    });
  }

  async createNotice(tenantId: string, dto: CreateNoticeDto) {
    return this.prisma.notice.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        targetAudience: dto.targetAudience ? [dto.targetAudience] : [],
        priority: dto.type === 'urgent' ? 'urgent' : 'normal',
      },
    });
  }

  async getNotices(tenantId: string) {
    return this.prisma.notice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteNotice(tenantId: string, id: string) {
    const notice = await this.prisma.notice.findFirst({ where: { tenantId, id } });
    if (!notice) throw new NotFoundException('Notice not found');

    await this.prisma.notice.delete({ where: { id } });
    return { message: 'Notice deleted successfully' };
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.messageRecipient.count({
      where: {
        userId,
        readAt: null,
        message: { tenantId },
      },
    });
    return { count };
  }
}
