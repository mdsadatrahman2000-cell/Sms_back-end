import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: { findFirst: jest.fn() },
      userRole: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create('tenant-1', {
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Smith',
        password: 'pass123',
      })).rejects.toThrow(ConflictException);
    });

    it('should create teacher with role', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1', email: 'teacher@test.com', firstName: 'John', lastName: 'Smith' });
      prisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'teacher' });
      prisma.userRole.create.mockResolvedValue({});

      const result = await service.create('tenant-1', {
        email: 'teacher@test.com',
        firstName: 'John',
        lastName: 'Smith',
        password: 'pass123',
      });

      expect(result).toHaveProperty('email', 'teacher@test.com');
      expect(prisma.userRole.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 't@test.com' }]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', 1, 10);
      expect(result.teachers).toHaveLength(1);
    });
  });
});
