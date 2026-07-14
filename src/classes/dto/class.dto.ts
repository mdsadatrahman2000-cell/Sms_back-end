import { IsString, IsOptional, IsInt, IsDateString, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsInt()
  gradeLevel?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  classTeacherId?: string;

  @IsString()
  academicYearId: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  gradeLevel?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @IsOptional()
  @IsString()
  classTeacherId?: string;
}
