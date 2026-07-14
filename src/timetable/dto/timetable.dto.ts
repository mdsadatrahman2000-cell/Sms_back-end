import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTimetableSlotDto {
  @IsString()
  classId: string;

  @IsString()
  subjectId: string;

  @IsString()
  teacherId: string;

  @IsNumber()
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsString()
  @IsOptional()
  room?: string;
}

export class BulkCreateTimetableDto {
  @IsString()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableSlotDto)
  slots: CreateTimetableSlotDto[];
}

export class UpdateTimetableSlotDto {
  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  room?: string;
}
