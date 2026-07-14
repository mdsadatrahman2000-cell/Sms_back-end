import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CreateModuleDto, CreateLessonDto, CreateAssignmentDto, SubmitAssignmentDto, GradeSubmissionDto } from './dto/lms.dto';

@Injectable()
export class LmsService {
  constructor(private prisma: PrismaService) {}

  async createCourse(tenantId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        classId: dto.classId,
      },
      include: { subject: { select: { name: true } }, teacher: { select: { firstName: true, lastName: true } } },
    });
  }

  async getCourses(tenantId: string, page = 1, limit = 20) {
    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { tenantId },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
          _count: { select: { modules: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: { tenantId } }),
    ]);
    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCourse(tenantId: string, id: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId, id },
      include: {
        subject: true,
        teacher: { select: { firstName: true, lastName: true } },
        modules: {
          include: { lessons: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async updateCourse(tenantId: string, id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findFirst({ where: { tenantId, id } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteCourse(tenantId: string, id: string) {
    const course = await this.prisma.course.findFirst({ where: { tenantId, id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.lesson.deleteMany({ where: { module: { courseId: id } } });
    await this.prisma.courseModule.deleteMany({ where: { courseId: id } });
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted' };
  }

  async addModule(tenantId: string, courseId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findFirst({ where: { tenantId, id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.courseModule.create({
      data: { courseId, title: dto.title, description: dto.description, orderIndex: dto.orderIndex },
    });
  }

  async updateModule(tenantId: string, moduleId: string, data: any) {
    return this.prisma.courseModule.update({ where: { id: moduleId }, data });
  }

  async deleteModule(moduleId: string) {
    await this.prisma.lesson.deleteMany({ where: { moduleId } });
    await this.prisma.courseModule.delete({ where: { id: moduleId } });
    return { message: 'Module deleted' };
  }

  async addLesson(tenantId: string, moduleId: string, dto: CreateLessonDto) {
    const mod = await this.prisma.courseModule.findFirst({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        contentText: dto.contentText,
        durationMinutes: dto.durationMinutes,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async updateLesson(lessonId: string, data: any) {
    return this.prisma.lesson.update({ where: { id: lessonId }, data });
  }

  async deleteLesson(lessonId: string) {
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { message: 'Lesson deleted' };
  }

  async createAssignment(tenantId: string, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        totalMarks: dto.totalMarks,
        dueDate: new Date(dto.dueDate),
        allowLateSubmission: dto.allowLateSubmission,
        latePenaltyPercent: dto.latePenaltyPercent,
      },
      include: { class: { select: { name: true } }, subject: { select: { name: true } } },
    });
  }

  async getAssignments(tenantId: string, classId?: string) {
    const where: any = { tenantId };
    if (classId) where.classId = classId;
    return this.prisma.assignment.findMany({
      where,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async getAssignment(tenantId: string, id: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { tenantId, id },
      include: {
        class: true,
        subject: true,
        submissions: {
          include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async submitAssignment(tenantId: string, assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findFirst({ where: { tenantId, id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const existing = await this.prisma.assignmentSubmission.findFirst({
      where: { tenantId, assignmentId, studentId },
    });
    if (existing) throw new BadRequestException('Already submitted');

    return this.prisma.assignmentSubmission.create({
      data: {
        tenantId,
        assignmentId,
        studentId,
        submissionUrl: dto.submissionUrl,
        submissionText: dto.submissionText,
      },
    });
  }

  async gradeSubmission(tenantId: string, submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { tenantId, id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained: dto.marksObtained,
        grade: dto.grade,
        feedback: dto.feedback,
        gradedAt: new Date(),
        status: 'graded',
      },
    });
  }
}
