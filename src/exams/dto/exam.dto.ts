import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @IsString()
  name: string;

  @IsString()
  classId: string;

  @IsString()
  subjectId: string;

  @IsEnum(['midterm', 'final', 'quiz', 'assignment', 'practical', 'other'])
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  totalMarks: number;

  @IsNumber()
  passingMarks: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class UpdateExamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['midterm', 'final', 'quiz', 'assignment', 'practical', 'other'])
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  totalMarks?: number;

  @IsNumber()
  @IsOptional()
  passingMarks?: number;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsEnum(['draft', 'published', 'completed'])
  @IsOptional()
  status?: string;
}

export class MarkEntryDto {
  @IsString()
  studentId: string;

  @IsNumber()
  marksObtained: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class SubmitMarksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  marks: MarkEntryDto[];
}
