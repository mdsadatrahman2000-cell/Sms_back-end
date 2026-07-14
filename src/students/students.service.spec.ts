import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate admission number', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create('tenant-1', {
        admissionNumber: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'pass123',
      })).rejects.toThrow(ConflictException);
    });

    it('should create student successfully', async () => {
      prisma.student.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'john@test.com' });
      prisma.student.create.mockResolvedValue({
        id: 'student-1',
        admissionNumber: 'STU001',
        user: { id: 'user-1', email: 'john@test.com', firstName: 'John', lastName: 'Doe' },
      });

      const result = await service.create('tenant-1', {
        admissionNumber: 'STU001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'pass123',
      });

      expect(result).toHaveProperty('id', 'student-1');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.student.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      prisma.student.findMany.mockResolvedValue([{ id: 's1', admissionNumber: 'STU001' }]);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', 1, 10);
      expect(result.students).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
