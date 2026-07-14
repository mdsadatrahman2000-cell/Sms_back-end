import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoginHistoryService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    location?: string;
    success: boolean;
    reason?: string;
  }) {
    return this.prisma.loginHistory.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        device: data.device,
        location: data.location,
        success: data.success,
        reason: data.reason,
      },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where: { tenantId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loginHistory.count({ where: { tenantId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(tenantId: string, userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where: { tenantId, userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loginHistory.count({ where: { tenantId, userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
