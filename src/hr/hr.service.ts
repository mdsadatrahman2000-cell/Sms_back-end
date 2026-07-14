import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20, department?: string, status?: string) {
    const where: any = {
      tenantId,
      userRoles: { some: { role: { name: { in: ['teacher', 'class_teacher'] } } } },
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: { include: { role: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { teachers: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, id },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    if (!user) throw new NotFoundException('Teacher not found');
    return user;
  }

  async getPayrollSummary(tenantId: string, month: string) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        status: 'active',
        userRoles: { some: { role: { name: { in: ['teacher', 'class_teacher'] } } } },
      },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    return {
      month,
      totalTeachers: users.length,
      teachers: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.userRoles[0]?.role?.name || 'teacher',
      })),
    };
  }
}
