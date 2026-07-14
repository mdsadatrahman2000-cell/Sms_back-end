import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, SubmitMarksDto } from './dto/exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        tenantId,
        name: dto.name,
        classId: dto.classId,
        subjectId: dto.subjectId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
      },
      include: {
        class: { select: { name: true, section: true } },
        subject: { select: { name: true, code: true } },
      },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20, classId?: string, subjectId?: string, type?: string, status?: string) {
    const where: any = { tenantId };
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true, code: true } },
          _count: { select: { marks: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return { exams, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { tenantId, id },
      include: {
        class: true,
        subject: true,
        marks: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { student: { admissionNumber: 'asc' } },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async update(tenantId: string, id: string, dto: UpdateExamDto) {
    const exam = await this.prisma.exam.findFirst({ where: { tenantId, id } });
    if (!exam) throw new NotFoundException('Exam not found');

    return this.prisma.exam.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        status: dto.status,
      },
    });
  }

  async submitMarks(tenantId: string, examId: string, dto: SubmitMarksDto) {
    const exam = await this.prisma.exam.findFirst({ where: { tenantId, id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    for (const mark of dto.marks) {
      await this.prisma.mark.upsert({
        where: {
          tenantId_examId_studentId: { tenantId, examId, studentId: mark.studentId },
        },
        update: { marksObtained: mark.marksObtained, remarks: mark.remarks },
        create: {
          tenantId,
          examId,
          studentId: mark.studentId,
          marksObtained: mark.marksObtained,
          remarks: mark.remarks,
        },
      });
    }

    return { message: 'Marks submitted successfully' };
  }

  async remove(tenantId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { tenantId, id } });
    if (!exam) throw new NotFoundException('Exam not found');

    await this.prisma.mark.deleteMany({ where: { examId: id } });
    await this.prisma.exam.delete({ where: { id } });
    return { message: 'Exam deleted successfully' };
  }

  async getResults(tenantId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { tenantId, id: examId },
      include: {
        marks: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { marksObtained: 'desc' },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const results = exam.marks.map((mark, index) => ({
      rank: index + 1,
      studentId: mark.studentId,
      name: `${mark.student.user.firstName} ${mark.student.user.lastName}`,
      admissionNumber: mark.student.admissionNumber,
      marksObtained: Number(mark.marksObtained),
      totalMarks: exam.totalMarks,
      percentage: Math.round((Number(mark.marksObtained) / exam.totalMarks) * 100),
      passed: Number(mark.marksObtained) >= exam.passingMarks,
    }));

    return { exam, results };
  }
}
