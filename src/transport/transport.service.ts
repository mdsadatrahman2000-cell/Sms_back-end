import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, AssignStudentDto } from './dto/transport.dto';

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async createRoute(tenantId: string, dto: CreateRouteDto) {
    return this.prisma.transportRoute.create({
      data: {
        tenantId,
        name: dto.name,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        monthlyFee: dto.monthlyFee,
        stops: { create: dto.stops.map((name, i) => ({ name, sortOrder: i })) },
      },
      include: { stops: true },
    });
  }

  async getRoutes(tenantId: string) {
    return this.prisma.transportRoute.findMany({
      where: { tenantId },
      include: { stops: { orderBy: { sortOrder: 'asc' } }, _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoute(tenantId: string, id: string) {
    const route = await this.prisma.transportRoute.findFirst({
      where: { tenantId, id },
      include: {
        stops: { orderBy: { sortOrder: 'asc' } },
        students: { include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async updateRoute(tenantId: string, id: string, data: any) {
    const route = await this.prisma.transportRoute.findFirst({ where: { tenantId, id } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.transportRoute.update({ where: { id }, data });
  }

  async deleteRoute(tenantId: string, id: string) {
    const route = await this.prisma.transportRoute.findFirst({ where: { tenantId, id } });
    if (!route) throw new NotFoundException('Route not found');
    await this.prisma.studentTransport.deleteMany({ where: { routeId: id } });
    await this.prisma.transportStop.deleteMany({ where: { routeId: id } });
    await this.prisma.transportRoute.delete({ where: { id } });
    return { message: 'Route deleted' };
  }

  async assignStudent(tenantId: string, dto: AssignStudentDto) {
    const student = await this.prisma.student.findFirst({ where: { tenantId, id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const route = await this.prisma.transportRoute.findFirst({ where: { tenantId, id: dto.routeId } });
    if (!route) throw new NotFoundException('Route not found');

    return this.prisma.studentTransport.upsert({
      where: { studentId: dto.studentId },
      create: { tenantId, studentId: dto.studentId, routeId: dto.routeId, stopName: dto.stopName },
      update: { routeId: dto.routeId, stopName: dto.stopName },
      include: { route: { select: { name: true } }, student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async unassignStudent(tenantId: string, studentId: string) {
    const assignment = await this.prisma.studentTransport.findFirst({ where: { tenantId, studentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.studentTransport.delete({ where: { studentId } });
    return { message: 'Student unassigned' };
  }
}
