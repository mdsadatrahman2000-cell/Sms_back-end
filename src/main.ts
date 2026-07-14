import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('School ERP API')
    .setDescription('International-standard School ERP + LMS SaaS Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('students', 'Student management')
    .addTag('teachers', 'Teacher management')
    .addTag('classes', 'Class management')
    .addTag('subjects', 'Subject management')
    .addTag('exams', 'Examination management')
    .addTag('fees', 'Fee management')
    .addTag('attendance', 'Attendance tracking')
    .addTag('lms', 'Learning Management System')
    .addTag('library', 'Library management')
    .addTag('transport', 'Transport management')
    .addTag('hostel', 'Hostel management')
    .addTag('inventory', 'Inventory management')
    .addTag('hr', 'Human Resources')
    .addTag('reports', 'Reports and analytics')
    .addTag('leaves', 'Leave management')
    .addTag('admissions', 'Admission management')
    .addTag('scholarships', 'Scholarship management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 10000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
