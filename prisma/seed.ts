import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const roles = [
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

const permissions = [
  // Students
  { name: 'students.create', module: 'students', action: 'create' },
  { name: 'students.read', module: 'students', action: 'read' },
  { name: 'students.update', module: 'students', action: 'update' },
  { name: 'students.delete', module: 'students', action: 'delete' },
  { name: 'students.export', module: 'students', action: 'export' },
  // Teachers
  { name: 'teachers.create', module: 'teachers', action: 'create' },
  { name: 'teachers.read', module: 'teachers', action: 'read' },
  { name: 'teachers.update', module: 'teachers', action: 'update' },
  { name: 'teachers.delete', module: 'teachers', action: 'delete' },
  // Classes
  { name: 'classes.create', module: 'classes', action: 'create' },
  { name: 'classes.read', module: 'classes', action: 'read' },
  { name: 'classes.update', module: 'classes', action: 'update' },
  { name: 'classes.delete', module: 'classes', action: 'delete' },
  // Subjects
  { name: 'subjects.create', module: 'subjects', action: 'create' },
  { name: 'subjects.read', module: 'subjects', action: 'read' },
  { name: 'subjects.update', module: 'subjects', action: 'update' },
  { name: 'subjects.delete', module: 'subjects', action: 'delete' },
  // Attendance
  { name: 'attendance.create', module: 'attendance', action: 'create' },
  { name: 'attendance.read', module: 'attendance', action: 'read' },
  { name: 'attendance.update', module: 'attendance', action: 'update' },
  // Exams
  { name: 'exams.create', module: 'exams', action: 'create' },
  { name: 'exams.read', module: 'exams', action: 'read' },
  { name: 'exams.update', module: 'exams', action: 'update' },
  { name: 'exams.delete', module: 'exams', action: 'delete' },
  // Finance
  { name: 'finance.create', module: 'finance', action: 'create' },
  { name: 'finance.read', module: 'finance', action: 'read' },
  { name: 'finance.update', module: 'finance', action: 'update' },
  { name: 'finance.approve', module: 'finance', action: 'approve' },
  // Settings
  { name: 'settings.read', module: 'settings', action: 'read' },
  { name: 'settings.update', module: 'settings', action: 'update' },
];

async function main() {
  console.log('Seeding database...');

  // 1. Create tenant
  const tenant = await prisma.tenant.upsert({
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
  console.log(`Tenant created: ${tenant.name}`);

  // 2. Create permissions
  const createdPermissions = [];
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(p);
  }
  console.log(`${createdPermissions.length} permissions created`);

  // 3. Create roles
  const createdRoles = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: TENANT_ID, name: role.name } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });
    createdRoles.push(r);
  }
  console.log(`${createdRoles.length} roles created`);

  // 4. Assign all permissions to super_admin
  const superAdminRole = createdRoles.find(r => r.name === 'super_admin');
  if (superAdminRole) {
    for (const perm of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: perm.id },
      });
    }
    console.log('All permissions assigned to super_admin');
  }

  // 5. Assign read permissions to school_admin
  const schoolAdminRole = createdRoles.find(r => r.name === 'school_admin');
  if (schoolAdminRole) {
    const readPerms = createdPermissions.filter(p => p.action === 'read' || p.action === 'create' || p.action === 'update');
    for (const perm of readPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: schoolAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: schoolAdminRole.id, permissionId: perm.id },
      });
    }
    console.log('Permissions assigned to school_admin');
  }

  // 6. Create admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.upsert({
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
  console.log(`Admin user created: ${adminUser.email}`);

  // 7. Assign super_admin role to admin user
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: adminUser.id, roleId: superAdminRole.id } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
    console.log('super_admin role assigned to admin user');
  }

  // 8. Create academic year
  const academicYear = await prisma.academicYear.upsert({
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
  console.log(`Academic year created: ${academicYear.name}`);

  // 9. Create some classes
  const classes = [
    { name: 'Grade 1', gradeLevel: 1, section: 'A' },
    { name: 'Grade 1', gradeLevel: 1, section: 'B' },
    { name: 'Grade 2', gradeLevel: 2, section: 'A' },
    { name: 'Grade 3', gradeLevel: 3, section: 'A' },
  ];

  for (const cls of classes) {
    await prisma.class.upsert({
      where: { tenantId_name_section_academicYearId: { tenantId: TENANT_ID, name: cls.name, section: cls.section, academicYearId: academicYear.id } },
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
  console.log(`${classes.length} classes created`);

  // 10. Create demo users
  const teacherRole = createdRoles.find(r => r.name === 'teacher');
  const studentRole = createdRoles.find(r => r.name === 'student');
  const parentRole = createdRoles.find(r => r.name === 'parent');

  const demoTeacher = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'teacher@school.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'teacher@school.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      emailVerified: true,
      status: 'active',
    },
  });
  if (teacherRole) {
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: demoTeacher.id, roleId: teacherRole.id } },
      update: {},
      create: { tenantId: TENANT_ID, userId: demoTeacher.id, roleId: teacherRole.id },
    });
  }
  console.log(`Demo teacher created: ${demoTeacher.email}`);

  const demoParent = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'parent@school.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'parent@school.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      emailVerified: true,
      status: 'active',
    },
  });
  if (parentRole) {
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: demoParent.id, roleId: parentRole.id } },
      update: {},
      create: { tenantId: TENANT_ID, userId: demoParent.id, roleId: parentRole.id },
    });
  }
  console.log(`Demo parent created: ${demoParent.email}`);

  const demoStudent = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: 'student@school.com' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      email: 'student@school.com',
      passwordHash: hashedPassword,
      firstName: 'Emily',
      lastName: 'Johnson',
      emailVerified: true,
      status: 'active',
    },
  });
  if (studentRole) {
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: demoStudent.id, roleId: studentRole.id } },
      update: {},
      create: { tenantId: TENANT_ID, userId: demoStudent.id, roleId: studentRole.id },
    });
  }
  console.log(`Demo student created: ${demoStudent.email}`);

  // 11. Create some subjects
  const subjects = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'History', code: 'HIST' },
    { name: 'Geography', code: 'GEO' },
    { name: 'Physical Education', code: 'PE' },
  ];

  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: sub.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        name: sub.name,
        code: sub.code,
      },
    });
  }
  console.log(`${subjects.length} subjects created`);

  console.log('\nSeed completed!');
  console.log('Login credentials:');
  console.log('  Email: admin@school.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
