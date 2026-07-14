import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @IsString()
  studentId: string;

  @IsString()
  date: string;

  @IsEnum(['present', 'absent', 'late', 'excused'])
  status: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateAttendanceDto {
  @IsEnum(['present', 'absent', 'late', 'excused'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AttendanceRecordDto {
  @IsString()
  studentId: string;

  @IsEnum(['present', 'absent', 'late', 'excused'])
  status: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkCreateAttendanceDto {
  @IsString()
  classId: string;

  @IsString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
