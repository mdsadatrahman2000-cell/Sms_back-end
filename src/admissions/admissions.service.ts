import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdmissionDto } from './dto/admission.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAdmissionDto) {
    return this.prisma.admission.create({
      data: { tenantId, ...dto, dateOfBirth: new Date(dto.dateOfBirth) },
    });
  }

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.admission.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const admission = await this.prisma.admission.findFirst({ where: { id, tenantId } });
    if (!admission) throw new NotFoundException('Admission not found');
    return this.prisma.admission.update({ where: { id }, data: { status } });
  }
}
