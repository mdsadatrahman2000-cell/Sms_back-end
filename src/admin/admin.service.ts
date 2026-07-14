import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const TENANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

interface RoleInput {
  name: string;
  description: string;
  isSystem: boolean;
}

interface PermissionInput {
  name: string;
  module: string;
  action: string;
}

const roles: RoleInput[] = [
  { name: 'super_admin', description: 'Platform super administrator', isSystem: true },
  { name: 'school_admin', description: 'School administrator', isSystem: true },
  { name: 'principal', description: 'School principal', isSystem: true },
  { name: 'vice_principal', description: 'Vice principal', isSystem: true },
  { name: 'teacher', description: 'Teacher', isSystem: true },
  { name: 'class_teacher', description: 'Homeroom teacher', isSystem: true },
  { name: 'student', description: 'Student', isSystem: true },
  { name: 'parent', description: 'Parent/Guardian', isSystem: true },
  { name: 'accountant', description: 'Accountant', isSystem: true },
  { name: 'hr', description: 'Human Resources', isSystem: true },
  { name: 'librarian', description: 'Librarian', isSystem: true },
  { name: 'transport_manager', description: 'Transport manager', isSystem: true },
  { name: 'hostel_manager', description: 'Hostel manager', isSystem: true },
  { name: 'inventory_manager', description: 'Inventory manager', isSystem: true },
  { name: 'exam_controller', description: 'Exam controller', isSystem: true },
  { name: 'guest', description: 'Guest user', isSystem: true },
];

const permissions: PermissionInput[] = [
  { name: 'students.create', module: 'students', action: 'create' },
  { name: 'students.read', module: 'students', action: 'read' },
  { name: 'students.update', module: 'students', action: 'update' },
  { name: 'students.delete', module: 'students', action: 'delete' },
  { name: 'students.export', module: 'students', action: 'export' },
  { name: 'teachers.create', module: 'teachers', action: 'create' },
  { name: 'teachers.read', module: 'teachers', action: 'read' },
  { name: 'teachers.update', module: 'teachers', action: 'update' },
  { name: 'teachers.delete', module: 'teachers', action: 'delete' },
  { name: 'classes.create', module: 'classes', action: 'create' },
  { name: 'classes.read', module: 'classes', action: 'read' },
  { name: 'classes.update', module: 'classes', action: 'update' },
  { name: 'classes.delete', module: 'classes', action: 'delete' },
  { name: 'subjects.create', module: 'subjects', action: 'create' },
  { name: 'subjects.read', module: 'subjects', action: 'read' },
  { name: 'subjects.update', module: 'subjects', action: 'update' },
  { name: 'subjects.delete', module: 'subjects', action: 'delete' },
  { name: 'attendance.create', module: 'attendance', action: 'create' },
  { name: 'attendance.read', module: 'attendance', action: 'read' },
  { name: 'attendance.update', module: 'attendance', action: 'update' },
  { name: 'exams.create', module: 'exams', action: 'create' },
  { name: 'exams.read', module: 'exams', action: 'read' },
  { name: 'exams.update', module: 'exams', action: 'update' },
  { name: 'exams.delete', module: 'exams', action: 'delete' },
  { name: 'finance.create', module: 'finance', action: 'create' },
  { name: 'finance.read', module: 'finance', action: 'read' },
  { name: 'finance.update', module: 'finance', action: 'update' },
  { name: 'finance.approve', module: 'finance', action: 'approve' },
  { name: 'settings.read', module: 'settings', action: 'read' },
  { name: 'settings.update', module: 'settings', action: 'update' },
];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async seed() {
    this.logger.log('Starting database seed...');

    const existingRoles = await this.prisma.role.count();
    if (existingRoles > 0) {
      return { message: 'Database already seeded', skipped: true };
    }

    // 1. Create tenant
    const tenant = await this.prisma.tenant.upsert({
      where: { slug: 'demo-school' },
      update: {},
      create: {
        id: TENANT_ID,
        name: 'Demo School',
        slug: 'demo-school',
        subdomain: 'demo',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        plan: 'free',
      },
    });
    this.logger.log(`Tenant: ${tenant.name}`);

    // 2. Create permissions
    const permMap: Record<string, string> = {};
    for (const perm of permissions) {
      const existing = await this.prisma.permission.findUnique({ where: { name: perm.name } });
      if (existing) {
        permMap[perm.name] = existing.id;
      } else {
        const created = await this.prisma.permission.create({ data: perm });
        permMap[perm.name] = created.id;
      }
    }
    this.logger.log(`${Object.keys(permMap).length} permissions created`);

    // 3. Create roles
    const roleMap: Record<string, string> = {};
    for (const role of roles) {
      const existing = await this.prisma.role.findFirst({
        where: { tenantId: TENANT_ID, name: role.name },
      });
      if (existing) {
        roleMap[role.name] = existing.id;
      } else {
        const created = await this.prisma.role.create({
          data: {
            tenantId: TENANT_ID,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
          },
        });
        roleMap[role.name] = created.id;
      }
    }
    this.logger.log(`${Object.keys(roleMap).length} roles created`);

    // 4. Assign all permissions to super_admin
    const superAdminRoleId = roleMap['super_admin'];
    const permIds = Object.values(permMap);
    for (const permId of permIds) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId: permId } },
        update: {},
        create: { roleId: superAdminRoleId, permissionId: permId },
      });
    }
    this.logger.log('All permissions assigned to super_admin');

    // 5. Assign most permissions to school_admin
    const schoolAdminRoleId = roleMap['school_admin'];
    const adminPermIds = permIds; // all for simplicity
    for (const permId of adminPermIds) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: schoolAdminRoleId, permissionId: permId } },
        update: {},
        create: { roleId: schoolAdminRoleId, permissionId: permId },
      });
    }
    this.logger.log('Permissions assigned to school_admin');

    // 6. Create admin user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminUser = await this.prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'admin@school.com' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        email: 'admin@school.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        emailVerified: true,
        status: 'active',
      },
    });
    this.logger.log(`Admin user: ${adminUser.email}`);

    // 7. Assign super_admin role to admin
    await this.prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: adminUser.id, roleId: superAdminRoleId } },
      update: {},
      create: { tenantId: TENANT_ID, userId: adminUser.id, roleId: superAdminRoleId },
    });
    this.logger.log('super_admin role assigned');

    // 8. Create academic year
    const academicYear = await this.prisma.academicYear.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: '2026-2027' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    });
    this.logger.log(`Academic year: ${academicYear.name}`);

    // 9. Create classes
    const classesData = [
      { name: 'Grade 1', gradeLevel: 1, section: 'A' },
      { name: 'Grade 1', gradeLevel: 1, section: 'B' },
      { name: 'Grade 2', gradeLevel: 2, section: 'A' },
      { name: 'Grade 3', gradeLevel: 3, section: 'A' },
    ];

    for (const cls of classesData) {
      await this.prisma.class.upsert({
        where: {
          tenantId_name_section_academicYearId: {
            tenantId: TENANT_ID,
            name: cls.name,
            section: cls.section,
            academicYearId: academicYear.id,
          },
        },
        update: {},
        create: {
          tenantId: TENANT_ID,
          name: cls.name,
          gradeLevel: cls.gradeLevel,
          section: cls.section,
          academicYearId: academicYear.id,
          maxCapacity: 40,
        },
      });
    }
    this.logger.log(`${classesData.length} classes created`);

    // 10. Create subjects
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English', code: 'ENG' },
      { name: 'Science', code: 'SCI' },
      { name: 'History', code: 'HIST' },
      { name: 'Geography', code: 'GEO' },
      { name: 'Physical Education', code: 'PE' },
    ];

    for (const sub of subjectsData) {
      await this.prisma.subject.upsert({
        where: { tenantId_code: { tenantId: TENANT_ID, code: sub.code } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          name: sub.name,
          code: sub.code,
        },
      });
    }
    this.logger.log(`${subjectsData.length} subjects created`);

    this.logger.log('Seed completed!');

    return {
      message: 'Database seeded successfully',
      credentials: {
        email: 'admin@school.com',
        password: 'password123',
      },
    };
  }

  async getSeedStatus() {
    const userCount = await this.prisma.user.count();
    const tenantCount = await this.prisma.tenant.count();
    const roleCount = await this.prisma.role.count();

    return {
      seeded: userCount > 0,
      tenants: tenantCount,
      users: userCount,
      roles: roleCount,
    };
  }
}
