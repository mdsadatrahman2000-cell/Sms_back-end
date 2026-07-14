import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalGuardians,
      totalDocuments,
      recentStudents,
      recentTeachers,
      attendanceToday,
      upcomingExams,
      revenueResult,
      pendingFeesResult,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.user.count({
        where: {
          tenantId,
          deletedAt: null,
          userRoles: { some: { role: { name: 'teacher' } } },
        },
      }),
      this.prisma.class.count({
        where: { tenantId },
      }),
      this.prisma.subject.count({
        where: { tenantId },
      }),
      this.prisma.guardian.count({
        where: { tenantId },
      }),
      this.prisma.document.count({
        where: { tenantId },
      }),
      this.prisma.student.findMany({
        where: { tenantId, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          class: true,
        },
      }),
      this.prisma.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          userRoles: { some: { role: { name: 'teacher' } } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          phone: true,
          createdAt: true,
        },
      }),
      this.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: {
          tenantId,
          date: { gte: today, lt: tomorrow },
        },
        _count: { status: true },
      }),
      this.prisma.exam.findMany({
        where: {
          tenantId,
          startDate: { gte: today },
        },
        take: 5,
        orderBy: { startDate: 'asc' },
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'unpaid' },
        _sum: { totalAmount: true },
      }),
    ]);

    const attendanceMap = { present: 0, absent: 0, late: 0 };
    for (const entry of attendanceToday) {
      const status = entry.status.toLowerCase();
      if (status in attendanceMap) {
        attendanceMap[status as keyof typeof attendanceMap] =
          entry._count.status;
      }
    }

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalGuardians,
      totalDocuments,
      recentStudents,
      recentTeachers,
      attendanceToday: attendanceMap,
      upcomingExams,
      totalRevenue: Number(revenueResult._sum.amount ?? 0),
      pendingFees: Number(pendingFeesResult._sum.totalAmount ?? 0),
    };
  }

  async getRecentActivity(tenantId: string) {
    const [recentStudents, recentTeachers, recentPayments] = await Promise.all([
      this.prisma.student.findMany({
        where: { tenantId, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          admissionNumber: true,
          createdAt: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: {
          tenantId,
          deletedAt: null,
          userRoles: { some: { role: { name: 'teacher' } } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          invoice: {
            select: {
              student: {
                select: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const activities = [
      ...recentStudents.map((s) => ({
        type: 'student_enrolled' as const,
        description: `${s.user.firstName} ${s.user.lastName} enrolled (${s.admissionNumber})`,
        timestamp: s.createdAt,
      })),
      ...recentTeachers.map((t) => ({
        type: 'teacher_added' as const,
        description: `${t.firstName} ${t.lastName} added as teacher`,
        timestamp: t.createdAt,
      })),
      ...recentPayments.map((p) => ({
        type: 'payment_received' as const,
        description: `Payment of ${p.amount} received from ${p.invoice.student.user.firstName} ${p.invoice.student.user.lastName}`,
        timestamp: p.createdAt,
      })),
    ];

    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return activities.slice(0, 10);
  }

  async getUpcomingEvents(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        startDate: { gte: today },
      },
      take: 10,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        totalMarks: true,
        status: true,
        class: { select: { name: true, section: true } },
        subject: { select: { name: true } },
      },
    });

    return upcomingExams.map((exam) => ({
      id: exam.id,
      type: 'exam' as const,
      title: exam.name,
      description: `${exam.type} - ${exam.subject.name} (${exam.class.name}${exam.class.section ? ' ' + exam.class.section : ''})`,
      startDate: exam.startDate,
      endDate: exam.endDate,
      metadata: {
        totalMarks: exam.totalMarks,
        status: exam.status,
      },
    }));
  }
}
