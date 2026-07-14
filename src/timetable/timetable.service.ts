import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableSlotDto, BulkCreateTimetableDto, UpdateTimetableSlotDto } from './dto/timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async createSlot(tenantId: string, dto: CreateTimetableSlotDto) {
    const existing = await this.prisma.timetableSlot.findFirst({
      where: {
        tenantId,
        classId: dto.classId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
      },
    });

    if (existing) {
      throw new BadRequestException('A slot already exists for this class at this time');
    }

    return this.prisma.timetableSlot.create({
      data: {
        tenantId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        class: { select: { name: true, section: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async bulkCreate(tenantId: string, dto: BulkCreateTimetableDto) {
    const slots = dto.slots.map((s) => ({
      tenantId,
      classId: dto.classId,
      subjectId: s.subjectId,
      teacherId: s.teacherId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
    }));

    await this.prisma.timetableSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });

    return { message: `Created ${slots.length} timetable slots` };
  }

  async getByClass(tenantId: string, classId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { tenantId, classId },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getByTeacher(tenantId: string, teacherId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { tenantId, teacherId },
      include: {
        class: { select: { name: true, section: true } },
        subject: { select: { name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateSlot(tenantId: string, id: string, dto: UpdateTimetableSlotDto) {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { tenantId, id } });
    if (!slot) throw new NotFoundException('Timetable slot not found');

    return this.prisma.timetableSlot.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async deleteSlot(tenantId: string, id: string) {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { tenantId, id } });
    if (!slot) throw new NotFoundException('Timetable slot not found');
    await this.prisma.timetableSlot.delete({ where: { id } });
    return { message: 'Slot deleted' };
  }

  async deleteByClass(tenantId: string, classId: string) {
    await this.prisma.timetableSlot.deleteMany({ where: { tenantId, classId } });
    return { message: 'Timetable cleared for class' };
  }
}
