import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateHrRecordDto {
  @IsString()
  teacherId: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsEnum(['full_time', 'part_time', 'contract', 'substitute'])
  employmentType: string;

  @IsDateString()
  joinDate: string;

  @IsNumber()
  salary: number;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  designation?: string;
}

export class UpdateHrRecordDto {
  @IsEnum(['full_time', 'part_time', 'contract', 'substitute'])
  @IsOptional()
  employmentType?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsEnum(['active', 'on_leave', 'terminated'])
  @IsOptional()
  status?: string;
}

export class CreateLeaveDto {
  @IsString()
  teacherId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(['sick', 'personal', 'vacation', 'maternity', 'other'])
  type: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreatePayrollDto {
  @IsString()
  teacherId: string;

  @IsString()
  month: string;

  @IsNumber()
  basicSalary: number;

  @IsNumber()
  @IsOptional()
  allowances?: number;

  @IsNumber()
  @IsOptional()
  deductions?: number;
}
