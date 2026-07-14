import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async apply(tenantId: string, userId: string, dto: CreateLeaveDto) {
    return this.prisma.leaveRequest.create({
      data: { tenantId, userId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), reason: dto.reason, type: dto.type || 'personal', notes: dto.notes },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async findAll(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    return this.prisma.leaveRequest.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(tenantId: string, id: string, approvedBy: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'approved', approvedBy } });
  }

  async reject(tenantId: string, id: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!leave) throw new NotFoundException('Leave request not found');
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'rejected' } });
  }
}
