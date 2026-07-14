import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTeacherDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
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

    const teacherRole = await this.prisma.role.findFirst({
      where: { tenantId, name: 'teacher' },
    });

    if (teacherRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: teacherRole.id,
          tenantId,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      employeeId: dto.employeeId,
      department: dto.department,
      designation: dto.designation,
    };
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const where: any = {
      tenantId,
      deletedAt: null,
      userRoles: { some: { role: { name: 'teacher' } } },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { teachers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const teacher = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id,
        userRoles: { some: { role: { name: 'teacher' } } },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(tenantId: string, id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id,
        userRoles: { some: { role: { name: 'teacher' } } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const teacher = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id,
        userRoles: { some: { role: { name: 'teacher' } } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });

    return { message: 'Teacher deleted successfully' };
  }
}
