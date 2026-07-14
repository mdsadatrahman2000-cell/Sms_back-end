import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto, UpdateGuardianDto } from './dto/guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateGuardianDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tenantId,
      },
    });

    const guardian = await this.prisma.guardian.create({
      data: {
        userId: user.id,
        relationship: dto.relationship,
        occupation: dto.occupation,
        workPhone: dto.workPhone,
        isPrimary: dto.isPrimary ?? false,
        tenantId,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (dto.studentId) {
      await this.prisma.studentGuardian.create({
        data: {
          guardianId: guardian.id,
          studentId: dto.studentId,
        },
      });
    }

    return guardian;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [guardians, total] = await Promise.all([
      this.prisma.guardian.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
          studentGuardians: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return { guardians, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        studentGuardians: {
          include: {
            student: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return guardian;
  }

  async update(tenantId: string, id: string, dto: UpdateGuardianDto) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, id },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    const updatedGuardian = await this.prisma.guardian.update({
      where: { id },
      data: {
        relationship: dto.relationship,
        occupation: dto.occupation,
        workPhone: dto.workPhone,
        isPrimary: dto.isPrimary,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (dto.firstName || dto.lastName) {
      await this.prisma.user.update({
        where: { id: guardian.userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    return updatedGuardian;
  }

  async remove(tenantId: string, id: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, id },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    await this.prisma.user.update({
      where: { id: guardian.userId },
      data: { deletedAt: new Date(), status: 'inactive' },
    });

    return { message: 'Guardian deleted successfully' };
  }

  async linkStudent(tenantId: string, guardianId: string, studentId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    const student = await this.prisma.student.findFirst({
      where: { tenantId, id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existing = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });

    if (existing) {
      throw new ConflictException('Student is already linked to this guardian');
    }

    return this.prisma.studentGuardian.create({
      data: { studentId, guardianId },
      include: {
        student: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        guardian: true,
      },
    });
  }

  async unlinkStudent(tenantId: string, guardianId: string, studentId: string) {
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    const existing = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });

    if (!existing) {
      throw new NotFoundException('Student is not linked to this guardian');
    }

    await this.prisma.studentGuardian.delete({
      where: { studentId_guardianId: { studentId, guardianId } },
    });

    return { message: 'Student unlinked from guardian successfully' };
  }
}
