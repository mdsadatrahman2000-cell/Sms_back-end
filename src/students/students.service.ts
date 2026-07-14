import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStudentDto) {
    const existingStudent = await this.prisma.student.findFirst({
      where: { tenantId, admissionNumber: dto.admissionNumber },
    });

    if (existingStudent) {
      throw new ConflictException('Admission number already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        tenantId,
      },
    });

    const student = await this.prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber: dto.admissionNumber,
        rollNumber: dto.rollNumber,
        classId: dto.classId,
        section: dto.section,
        bloodGroup: dto.bloodGroup,
        medicalConditions: dto.medicalConditions,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        nationality: dto.nationality,
        previousSchool: dto.previousSchool,
        admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : undefined,
        tenantId,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        class: true,
      },
    });

    return student;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const where: any = { tenantId, deletedAt: null };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
          class: { select: { id: true, name: true, section: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        class: true,
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        marks: { include: { exam: true }, orderBy: { createdAt: 'desc' } },
        studentGuardians: { include: { guardian: { include: { user: true } } } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        rollNumber: dto.rollNumber,
        classId: dto.classId,
        section: dto.section,
        bloodGroup: dto.bloodGroup,
        medicalConditions: dto.medicalConditions,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        nationality: dto.nationality,
        previousSchool: dto.previousSchool,
        status: dto.status,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        class: true,
      },
    });

    if (dto.firstName || dto.lastName || dto.phone) {
      await this.prisma.user.update({
        where: { id: student.userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });
    }

    return updatedStudent;
  }

  async remove(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });

    return { message: 'Student deleted successfully' };
  }
}
