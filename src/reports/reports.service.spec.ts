import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      mark: { findMany: jest.fn() },
      studentAttendance: { groupBy: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getReportCard', () => {
    it('should throw NotFoundException for missing student', async () => {
      prisma.student.findFirst.mockResolvedValue(null);
      await expect(service.getReportCard('tenant-1', 'missing'))
        .rejects.toThrow(NotFoundException);
    });

    it('should return report card with GPA and attendance', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: 's1',
        user: { firstName: 'John', lastName: 'Doe' },
        class: { name: 'Grade 1' },
        admissionNumber: 'STU001',
      });
      prisma.mark.findMany.mockResolvedValue([{
        exam: { name: 'Midterm', totalMarks: 100, subject: { name: 'Math' } },
        marksObtained: 85,
      }]);
      prisma.studentAttendance.groupBy.mockResolvedValue([
        { status: 'present', _count: { status: 45 } },
        { status: 'absent', _count: { status: 5 } },
      ]);

      const result = await service.getReportCard('tenant-1', 's1');

      expect(result).toHaveProperty('gpa');
      expect(result).toHaveProperty('attendanceRate');
      expect(result.student.name).toBe('John Doe');
    });
  });

  describe('getClassRankings', () => {
    it('should return sorted rankings by GPA', async () => {
      prisma.student.findMany.mockResolvedValue([
        { id: 's1', user: { firstName: 'Alice' } },
        { id: 's2', user: { firstName: 'Bob' } },
      ]);
      prisma.mark.findMany
        .mockResolvedValueOnce([{ exam: { totalMarks: 100 }, marksObtained: 95 }])
        .mockResolvedValueOnce([{ exam: { totalMarks: 100 }, marksObtained: 85 }]);

      const result = await service.getClassRankings('tenant-1', 'class-1');
      expect(result).toHaveLength(2);
    });
  });
});
