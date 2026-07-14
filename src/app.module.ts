import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
