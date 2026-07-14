import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectesModule } from './subjects/subjects.module';
import { AdminModule } from './admin/admin.module';
import { TenantsModule } from './tenants/tenants.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { GuardiansModule } from './guardians/guardians.module';
import { UploadModule } from './upload/upload.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RolesModule } from './roles/roles.module';
import { AttendancesModule } from './attendances/attendances.module';
import { ExamsModule } from './exams/exams.module';
import { FeesModule } from './fees/fees.module';
import { HrModule } from './hr/hr.module';
import { LibraryModule } from './library/library.module';
import { TransportModule } from './transport/transport.module';
import { HostelModule } from './hostel/hostel.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LmsModule } from './lms/lms.module';
import { TimetableModule } from './timetable/timetable.module';
import { ReportsModule } from './reports/reports.module';
import { LeavesModule } from './leaves/leaves.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 900000, limit: 5 },
      { name: 'default', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    CommonModule,
    AuthModule,
    AdminModule,
    TenantsModule,
    AcademicYearsModule,
    GuardiansModule,
    UploadModule,
    DashboardModule,
    RolesModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    SubjectesModule,
    AttendancesModule,
    ExamsModule,
    FeesModule,
    HrModule,
    LibraryModule,
    TransportModule,
    HostelModule,
    InventoryModule,
    NotificationsModule,
    LmsModule,
    TimetableModule,
    ReportsModule,
    LeavesModule,
    AdmissionsModule,
    ScholarshipsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
