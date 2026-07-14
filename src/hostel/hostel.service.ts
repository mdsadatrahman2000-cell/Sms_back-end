import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHostelDto, CreateRoomDto, AssignRoomDto } from './dto/hostel.dto';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  async createHostel(tenantId: string, dto: CreateHostelDto) {
    return this.prisma.hostel.create({
      data: {
        tenantId,
        name: dto.name,
        address: dto.address,
        capacity: dto.capacity,
        wardenName: dto.wardenName,
        wardenPhone: dto.wardenPhone,
      },
    });
  }

  async getHostels(tenantId: string) {
    return this.prisma.hostel.findMany({
      where: { tenantId },
      include: { _count: { select: { rooms: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHostel(tenantId: string, id: string) {
    const hostel = await this.prisma.hostel.findFirst({
      where: { tenantId, id },
      include: { rooms: { include: { allocations: { where: { status: 'active' }, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } } } } },
    });
    if (!hostel) throw new NotFoundException('Hostel not found');
    return hostel;
  }

  async updateHostel(tenantId: string, id: string, data: any) {
    const hostel = await this.prisma.hostel.findFirst({ where: { tenantId, id } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    return this.prisma.hostel.update({ where: { id }, data });
  }

  async deleteHostel(tenantId: string, id: string) {
    const hostel = await this.prisma.hostel.findFirst({ where: { tenantId, id } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    await this.prisma.hostelAllocation.deleteMany({ where: { room: { hostelId: id } } });
    await this.prisma.hostelRoom.deleteMany({ where: { hostelId: id } });
    await this.prisma.hostel.delete({ where: { id } });
    return { message: 'Hostel deleted' };
  }

  async createRoom(tenantId: string, dto: CreateRoomDto) {
    const hostel = await this.prisma.hostel.findFirst({ where: { tenantId, id: dto.hostelId } });
    if (!hostel) throw new NotFoundException('Hostel not found');

    return this.prisma.hostelRoom.create({
      data: {
        tenantId,
        hostelId: dto.hostelId,
        roomNumber: dto.roomNumber,
        type: dto.type,
        capacity: dto.capacity,
        monthlyFee: dto.monthlyFee,
      },
    });
  }

  async getRooms(tenantId: string, hostelId?: string) {
    const where: any = { tenantId };
    if (hostelId) where.hostelId = hostelId;

    return this.prisma.hostelRoom.findMany({
      where,
      include: {
        hostel: { select: { name: true } },
        _count: { select: { allocations: { where: { status: 'active' } } } },
      },
    });
  }

  async assignRoom(tenantId: string, dto: AssignRoomDto) {
    const room = await this.prisma.hostelRoom.findFirst({ where: { tenantId, id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const currentAllocations = await this.prisma.hostelAllocation.count({
      where: { roomId: dto.roomId, status: 'active' },
    });

    if (currentAllocations >= room.capacity) {
      throw new BadRequestException('Room is at full capacity');
    }

    const existing = await this.prisma.hostelAllocation.findFirst({
      where: { tenantId, studentId: dto.studentId, status: 'active' },
    });
    if (existing) throw new BadRequestException('Student already has an active allocation');

    return this.prisma.hostelAllocation.create({
      data: { tenantId, roomId: dto.roomId, studentId: dto.studentId },
      include: { room: true, student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async unassignRoom(tenantId: string, allocationId: string) {
    const allocation = await this.prisma.hostelAllocation.findFirst({ where: { tenantId, id: allocationId } });
    if (!allocation) throw new NotFoundException('Allocation not found');

    return this.prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: { endDate: new Date(), status: 'inactive' },
    });
  }
}
