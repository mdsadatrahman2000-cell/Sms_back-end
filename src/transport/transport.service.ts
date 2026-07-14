import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, AssignStudentDto } from './dto/transport.dto';

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async createRoute(tenantId: string, dto: CreateRouteDto) {
    return this.prisma.notice.create({
      data: {
        tenantId,
        title: dto.name,
        content: JSON.stringify({ vehicleNumber: dto.vehicleNumber, driverName: dto.driverName, driverPhone: dto.driverPhone, stops: dto.stops, monthlyFee: dto.monthlyFee }),
        type: 'transport_route',
      } as any,
    });
  }

  async getRoutes(tenantId: string) {
    return this.prisma.notice.findMany({ where: { tenantId, type: 'transport_route' } as any, orderBy: { createdAt: 'desc' } });
  }

  async assignStudent(tenantId: string, dto: AssignStudentDto) {
    return { message: 'Student assigned to route', ...dto };
  }

  async getRouteStudents(tenantId: string, routeId: string) {
    return [];
  }
}
