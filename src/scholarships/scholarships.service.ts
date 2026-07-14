import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScholarshipDto, ApplyScholarshipDto } from './dto/scholarship.dto';

@Injectable()
export class ScholarshipsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateScholarshipDto) {
    return this.prisma.scholarship.create({
      data: { tenantId, name: dto.name, description: dto.description, amount: dto.amount, type: dto.type || 'fixed', maxRecipients: dto.maxRecipients },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.scholarship.findMany({
      where: { tenantId },
      include: { recipients: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async apply(tenantId: string, scholarshipId: string, dto: ApplyScholarshipDto) {
    const scholarship = await this.prisma.scholarship.findFirst({ where: { id: scholarshipId, tenantId } });
    if (!scholarship) throw new NotFoundException('Scholarship not found');
    if (scholarship.maxRecipients) {
      const count = await this.prisma.studentScholarship.count({ where: { scholarshipId } });
      if (count >= scholarship.maxRecipients) throw new BadRequestException('Maximum recipients reached');
    }
    const existing = await this.prisma.studentScholarship.findFirst({ where: { scholarshipId, studentId: dto.studentId } });
    if (existing) throw new BadRequestException('Student already has this scholarship');
    return this.prisma.studentScholarship.create({
      data: { tenantId, scholarshipId, studentId: dto.studentId, notes: dto.notes },
    });
  }

  async unapply(scholarshipId: string, studentId: string) {
    await this.prisma.studentScholarship.deleteMany({ where: { scholarshipId, studentId } });
    return { message: 'Scholarship removed' };
  }
}
