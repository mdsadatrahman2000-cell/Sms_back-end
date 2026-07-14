import { Test, TestingModule } from '@nestjs/testing';
import { FeesService } from './fees.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FeesService', () => {
  let service: FeesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      feeStructure: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
      student: { findFirst: jest.fn() },
      studentGuardian: { findFirst: jest.fn() },
      invoice: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      payment: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  describe('createFeeStructure', () => {
    it('should create fee structure with items', async () => {
      prisma.feeStructure.create.mockResolvedValue({
        id: 'fs-1',
        name: 'Tuition Fee',
        totalAmount: 500,
        items: [{ name: 'Tuition', amount: 500 }],
      });

      const result = await service.createFeeStructure('tenant-1', {
        name: 'Tuition Fee',
        classId: 'class-1',
        academicYearId: 'ay-1',
        items: [{ name: 'Tuition', amount: 500 }],
      });

      expect(result).toHaveProperty('id', 'fs-1');
      expect(prisma.feeStructure.create).toHaveBeenCalled();
    });
  });

  describe('createInvoice', () => {
    it('should throw NotFoundException for missing student', async () => {
      prisma.student.findFirst.mockResolvedValue(null);
      await expect(service.createInvoice('tenant-1', {
        studentId: 'missing',
        feeStructureId: 'fs-1',
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for missing fee structure', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's1' });
      prisma.feeStructure.findFirst.mockResolvedValue(null);
      await expect(service.createInvoice('tenant-1', {
        studentId: 's1',
        feeStructureId: 'missing',
      })).rejects.toThrow(NotFoundException);
    });
  });
});
