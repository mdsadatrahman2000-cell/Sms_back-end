import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ContactFormDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Inquiry about admissions' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'I would like to know about your admission process...' })
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}

@ApiTags('public')
@Controller('public')
export class PublicController {
  @Get('features')
  @ApiOperation({ summary: 'List platform features' })
  getFeatures() {
    return {
      features: [
        { name: 'Student Management', description: 'Complete student lifecycle management', icon: 'users' },
        { name: 'Teacher Portal', description: 'Teacher tools and classroom management', icon: 'book-open' },
        { name: 'Parent Portal', description: 'Real-time parent engagement', icon: 'home' },
        { name: 'Attendance', description: 'Digital attendance tracking with analytics', icon: 'check-circle' },
        { name: 'Examinations', description: 'Exam scheduling and result management', icon: 'file-text' },
        { name: 'Fee Management', description: 'Automated billing and payment tracking', icon: 'credit-card' },
        { name: 'Library', description: 'Book catalog and issue management', icon: 'book' },
        { name: 'Transport', description: 'Route management and GPS tracking', icon: 'map' },
        { name: 'Hostel', description: 'Hostel and accommodation management', icon: 'building' },
        { name: 'Inventory', description: 'Stock management and procurement', icon: 'package' },
        { name: 'LMS', description: 'Learning management system with courses', icon: 'monitor' },
        { name: 'Reports', description: 'Analytics and custom report generation', icon: 'bar-chart' },
      ],
    };
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get pricing plans' })
  getPricing() {
    return {
      plans: [
        {
          name: 'Free',
          price: 0,
          period: 'forever',
          features: ['Up to 50 students', 'Basic attendance', 'Fee tracking', 'Email support'],
          limits: { students: 50, teachers: 5, storage: '100MB' },
        },
        {
          name: 'Basic',
          price: 29,
          period: 'per month',
          features: ['Up to 200 students', 'All Free features', 'LMS', 'Library management'],
          limits: { students: 200, teachers: 20, storage: '5GB' },
        },
        {
          name: 'Professional',
          price: 79,
          period: 'per month',
          features: ['Up to 1000 students', 'All Basic features', 'Transport', 'Hostel', 'Advanced reports'],
          limits: { students: 1000, teachers: 100, storage: '50GB' },
        },
        {
          name: 'Enterprise',
          price: 199,
          period: 'per month',
          features: ['Unlimited students', 'All Professional features', 'Custom integrations', 'Priority support'],
          limits: { students: -1, teachers: -1, storage: 'Unlimited' },
        },
      ],
    };
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit contact form' })
  async submitContact(@Body() dto: ContactFormDto) {
    return {
      message: 'Thank you for your inquiry. We will get back to you within 24 hours.',
      ticketId: `CONTACT-${Date.now()}`,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Public health check' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' };
  }
}
