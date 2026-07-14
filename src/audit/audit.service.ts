import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.warn(`Audit log failed: ${err.message}`);
    }
  }
}
