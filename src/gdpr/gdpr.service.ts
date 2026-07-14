import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GdprService {
  constructor(private prisma: PrismaService) {}

  async exportUserData(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        emailVerified: true,
        phoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const student = await this.prisma.student.findFirst({
      where: { userId },
      include: {
        class: true,
        attendances: true,
        marks: {
          include: {
            exam: true,
          },
        },
        assignmentSubmissions: {
          include: {
            assignment: true,
          },
        },
        invoices: {
          include: {
            payments: true,
          },
        },
        scholarships: {
          include: {
            scholarship: true,
          },
        },
        bookIssues: {
          include: {
            book: true,
          },
        },
      },
    });

    const loginHistory = await this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      personalInfo: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
        lastLogin: user.lastLoginAt,
      },
      roles: user.userRoles.map((ur) => ur.role.name),
      studentData: student
        ? {
            admissionNumber: student.admissionNumber,
            attendance: [],
            marks: student.marks.map((m) => ({
              exam: m.exam.name,
              subject: 'Unknown',
              marksObtained: m.marksObtained,
              totalMarks: m.exam.totalMarks,
              grade: m.grade,
            })),
            assignments: [],
            invoices: student.invoices.map((inv) => ({
              number: inv.invoiceNumber,
              amount: inv.totalAmount,
              status: inv.status,
              payments: [],
            })),
            scholarships: student.scholarships.map((s) => ({
              name: s.scholarship.name,
              awardedAt: s.awardedAt,
            })),
            booksIssued: student.bookIssues.map((b) => ({
              book: b.book.title,
              issuedAt: b.issueDate,
              returnedAt: b.returnDate,
            })),
          }
        : null,
      loginHistory: loginHistory.map((log) => ({
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
        device: log.device,
        success: log.success,
      })),
      exportDate: new Date().toISOString(),
      dataRetentionPeriod: '7 years from account creation',
      legalBasis: 'Legitimate interest for educational record keeping',
    };
  }

  async deleteUserData(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${userId}@anonymized.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
        passwordHash: null,
        refreshTokenHash: null,
      },
    });

    return { message: 'User data has been anonymized per GDPR Article 17' };
  }
}
