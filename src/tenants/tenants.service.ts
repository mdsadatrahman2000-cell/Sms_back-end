import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        subdomain: dto.subdomain,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        timezone: dto.timezone || 'UTC',
        currency: dto.currency || 'USD',
        language: dto.language || 'en',
        plan: dto.plan || 'free',
      },
      include: {
        _count: {
          select: { users: true, classes: true, students: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { users: true, classes: true, students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, classes: true, students: true, roles: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.name) {
      const existing = await this.prisma.tenant.findFirst({
        where: { slug: dto.name.toLowerCase().replace(/\s+/g, '-'), id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Tenant name already in use');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.subdomain !== undefined && { subdomain: dto.subdomain }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.language && { language: dto.language }),
        ...(dto.plan && { plan: dto.plan }),
      },
      include: {
        _count: {
          select: { users: true, classes: true, students: true },
        },
      },
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete - don't hard delete tenants
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Tenant deleted successfully' };
  }
}
