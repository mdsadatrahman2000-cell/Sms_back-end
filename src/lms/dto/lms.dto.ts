import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  teacherId: string;

  @IsString()
  @IsOptional()
  classId?: string;
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;
}

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  orderIndex: number;
}

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  contentType: string;

  @IsString()
  @IsOptional()
  contentUrl?: string;

  @IsString()
  @IsOptional()
  contentText?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  orderIndex: number;
}

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  classId: string;

  @IsString()
  subjectId: string;

  @IsString()
  teacherId: string;

  @IsNumber()
  @IsOptional()
  totalMarks?: number;

  @IsString()
  dueDate: string;

  @IsOptional()
  allowLateSubmission?: boolean;

  @IsNumber()
  @IsOptional()
  latePenaltyPercent?: number;
}

export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  submissionUrl?: string;

  @IsString()
  @IsOptional()
  submissionText?: string;
}

export class GradeSubmissionDto {
  @IsNumber()
  marksObtained: number;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  feedback?: string;
}
