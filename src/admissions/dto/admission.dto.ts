import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAdmissionDto {
  @IsString()
  studentName: string;

  @IsString()
  parentName: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  gradeApplying: string;

  @IsString()
  @IsOptional()
  previousSchool?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
