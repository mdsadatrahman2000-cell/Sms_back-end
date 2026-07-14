import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSubjectDto) {
    if (dto.code) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: { tenantId, code: dto.code },
      });

      if (existingSubject) {
        throw new ConflictException('Subject code already exists');
      }
    }

    return this.prisma.subject.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isElective: dto.isElective,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
      include: {
        _count: { select: { classSubjects: true, courses: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { tenantId, id },
      include: {
        classSubjects: {
          include: {
            class: true,
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        courses: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async update(tenantId: string, id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findFirst({
      where: { tenantId, id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (dto.code && dto.code !== subject.code) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: { tenantId, code: dto.code },
      });

      if (existingSubject) {
        throw new ConflictException('Subject code already exists');
      }
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isElective: dto.isElective,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { tenantId, id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.prisma.subject.delete({ where: { id } });
    return { message: 'Subject deleted successfully' };
  }
}
