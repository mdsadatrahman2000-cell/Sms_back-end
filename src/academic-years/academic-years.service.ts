import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto, tenantId: string) {
    const existing = await this.prisma.academicYear.findFirst({
      where: { tenantId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Academic year with this name already exists');
    }

    return this.prisma.academicYear.create({
      data: {
        tenantId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id, tenantId },
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    return academicYear;
  }

  async update(id: string, dto: UpdateAcademicYearDto, tenantId: string) {
    await this.findOne(id, tenantId);

    if (dto.name) {
      const existing = await this.prisma.academicYear.findFirst({
        where: { tenantId, name: dto.name, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException('Academic year with this name already exists');
      }
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isCurrent !== undefined && { isCurrent: dto.isCurrent }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.academicYear.delete({
      where: { id },
    });
  }

  async setCurrent(id: string, tenantId: string) {
    const academicYear = await this.findOne(id, tenantId);

    await this.prisma.academicYear.updateMany({
      where: { tenantId, isCurrent: true },
      data: { isCurrent: false },
    });

    return this.prisma.academicYear.update({
      where: { id },
      data: { isCurrent: true },
    });
  }
}
