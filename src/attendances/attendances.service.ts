import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto, BulkCreateAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendancesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAttendanceDto) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existing = await this.prisma.studentAttendance.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        date: new Date(dto.date),
      },
    });

    if (existing) {
      throw new BadRequestException('Attendance already recorded for this date');
    }

    return this.prisma.studentAttendance.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        classId: student.classId!,
        date: new Date(dto.date),
        status: dto.status,
        notes: dto.remarks,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        class: { select: { name: true, section: true } },
      },
    });
  }

  async bulkCreate(tenantId: string, dto: BulkCreateAttendanceDto) {
    const classRecord = await this.prisma.class.findFirst({
      where: { tenantId, id: dto.classId },
    });

    if (!classRecord) {
      throw new NotFoundException('Class not found');
    }

    const records = dto.records.map((r) => ({
      tenantId,
      studentId: r.studentId,
      classId: dto.classId,
      date: new Date(dto.date),
      status: r.status,
      notes: r.remarks,
    }));

    await this.prisma.studentAttendance.createMany({
      data: records,
      skipDuplicates: true,
    });

    return { message: `Attendance recorded for ${records.length} students` };
  }

  async findAll(tenantId: string, page = 1, limit = 20, classId?: string, date?: string, studentId?: string) {
    const where: any = { tenantId };

    if (classId) where.classId = classId;
    if (date) where.date = new Date(date);
    if (studentId) where.studentId = studentId;

    const [records, total] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where,
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
          class: { select: { name: true, section: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.studentAttendance.count({ where }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.studentAttendance.findFirst({
      where: { tenantId, id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        class: { select: { name: true, section: true } },
      },
    });

    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async update(tenantId: string, id: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.studentAttendance.findFirst({
      where: { tenantId, id },
    });

    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.studentAttendance.update({
      where: { id },
      data: { status: dto.status, notes: dto.remarks },
    });
  }

  async getByStudent(tenantId: string, studentId: string, month?: string) {
    const where: any = { tenantId, studentId };
    if (month) {
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    return this.prisma.studentAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getByClass(tenantId: string, classId: string, date: string) {
    return this.prisma.studentAttendance.findMany({
      where: {
        tenantId,
        classId,
        date: new Date(date),
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { student: { admissionNumber: 'asc' } },
    });
  }

  async getSummary(tenantId: string, classId: string, month: string) {
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const students = await this.prisma.student.findMany({
      where: { tenantId, classId, status: 'active' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        attendances: {
          where: { date: { gte: startDate, lt: endDate } },
        },
      },
    });

    return students.map((s) => {
      const total = s.attendances.length;
      const present = s.attendances.filter((a) => a.status === 'present').length;
      return {
        studentId: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        totalDays: total,
        present,
        absent: total - present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });
  }
}
