import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReportCard(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id: studentId },
      include: { user: { select: { firstName: true, lastName: true, email: true } }, class: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const marks = await this.prisma.mark.findMany({
      where: { tenantId, studentId },
      include: { exam: { select: { name: true, type: true, totalMarks: true, passingMarks: true, subject: { select: { name: true } } } } },
    });

    const attendance = await this.prisma.studentAttendance.groupBy({
      by: ['status'],
      where: { tenantId, studentId },
      _count: { status: true },
    });

    const total = attendance.reduce((sum, a) => sum + a._count.status, 0);
    const present = attendance.find(a => a.status === 'present')?._count.status || 0;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    const gradePoints: Record<string, number> = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0 };
    let totalPoints = 0;
    let gradedSubjects = 0;

    const results = marks.map(m => {
      const percentage = m.exam.totalMarks > 0 ? Math.round((Number(m.marksObtained) / m.exam.totalMarks) * 100) : 0;
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';
      totalPoints += gradePoints[grade] || 0;
      gradedSubjects++;
      return { subject: m.exam.subject?.name, exam: m.exam.name, marks: Number(m.marksObtained), totalMarks: m.exam.totalMarks, percentage, grade };
    });

    const gpa = gradedSubjects > 0 ? Math.round((totalPoints / gradedSubjects) * 100) / 100 : 0;

    return { student: { id: student.id, name: `${student.user.firstName} ${student.user.lastName}`, admissionNumber: student.admissionNumber, className: student.class?.name }, results, gpa, attendanceRate, attendanceStats: { total, present, absent: total - present } };
  }

  async getClassRankings(tenantId: string, classId: string) {
    const students = await this.prisma.student.findMany({
      where: { tenantId, classId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const rankings = await Promise.all(students.map(async (s) => {
      const marks = await this.prisma.mark.findMany({ where: { tenantId, studentId: s.id }, include: { exam: { select: { totalMarks: true } } } });
      const gradePoints: Record<string, number> = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0 };
      let totalPoints = 0, count = 0;
      marks.forEach(m => {
        const pct = m.exam.totalMarks > 0 ? (Number(m.marksObtained) / m.exam.totalMarks) * 100 : 0;
        let g = 'F';
        if (pct >= 90) g = 'A'; else if (pct >= 80) g = 'B'; else if (pct >= 70) g = 'C'; else if (pct >= 60) g = 'D';
        totalPoints += gradePoints[g]; count++;
      });
      return { id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, admissionNumber: s.admissionNumber, gpa: count > 0 ? Math.round((totalPoints / count) * 100) / 100 : 0, totalMarks: marks.reduce((sum, m) => sum + Number(m.marksObtained), 0) };
    }));

    rankings.sort((a, b) => b.gpa - a.gpa);
    return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async getAttendanceSummary(tenantId: string, studentId: string) {
    const stats = await this.prisma.studentAttendance.groupBy({
      by: ['status'],
      where: { tenantId, studentId },
      _count: { status: true },
    });
    const total = stats.reduce((sum, s) => sum + s._count.status, 0);
    const result: Record<string, number> = {};
    stats.forEach(s => { result[s.status] = s._count.status; });
    return { total, ...result, rate: total > 0 ? Math.round(((result.present || 0) / total) * 100) : 0 };
  }
}
