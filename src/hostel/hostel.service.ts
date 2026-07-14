import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHostelDto, CreateRoomDto, AssignRoomDto } from './dto/hostel.dto';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  async createHostel(tenantId: string, dto: CreateHostelDto) {
    return this.prisma.notice.create({
      data: {
        tenantId,
        title: dto.name,
        content: JSON.stringify({ address: dto.address, capacity: dto.capacity, wardenName: dto.wardenName, wardenPhone: dto.wardenPhone }),
        type: 'hostel',
      } as any,
    });
  }

  async getHostels(tenantId: string) {
    return this.prisma.notice.findMany({ where: { tenantId, type: 'hostel' } as any, orderBy: { createdAt: 'desc' } });
  }

  async createRoom(tenantId: string, dto: CreateRoomDto) {
    return { message: 'Room created', ...dto };
  }

  async getRooms(tenantId: string, hostelId?: string) {
    return [];
  }

  async assignRoom(tenantId: string, dto: AssignRoomDto) {
    return { message: 'Room assigned', ...dto };
  }
}
