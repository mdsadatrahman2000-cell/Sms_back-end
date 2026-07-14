import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClassDto) {
    const existingClass = await this.prisma.class.findFirst({
      where: {
        tenantId,
        name: dto.name,
        section: dto.section || null,
        academicYearId: dto.academicYearId,
      },
    });

    if (existingClass) {
      throw new ConflictException('Class with this name and section already exists');
    }

    return this.prisma.class.create({
      data: {
        name: dto.name,
        gradeLevel: dto.gradeLevel,
        section: dto.section,
        maxCapacity: dto.maxCapacity,
        classTeacherId: dto.classTeacherId,
        academicYearId: dto.academicYearId,
        tenantId,
      },
      include: {
        classTeacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: true,
        _count: { select: { students: true } },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      include: {
        classTeacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: true,
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const classData = await this.prisma.class.findFirst({
      where: { tenantId, id },
      include: {
        classTeacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: true,
        students: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { students: true } },
      },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return classData;
  }

  async update(tenantId: string, id: string, dto: UpdateClassDto) {
    const classData = await this.prisma.class.findFirst({
      where: { tenantId, id },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.class.update({
      where: { id },
      data: {
        name: dto.name,
        gradeLevel: dto.gradeLevel,
        section: dto.section,
        maxCapacity: dto.maxCapacity,
        classTeacherId: dto.classTeacherId,
      },
      include: {
        classTeacher: { select: { id: true, firstName: true, lastName: true } },
        academicYear: true,
        _count: { select: { students: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const classData = await this.prisma.class.findFirst({
      where: { tenantId, id },
    });

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    await this.prisma.class.delete({ where: { id } });
    return { message: 'Class deleted successfully' };
  }
}
