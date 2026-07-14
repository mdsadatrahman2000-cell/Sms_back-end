import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateScholarshipDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  maxRecipients?: number;
}

export class ApplyScholarshipDto {
  @IsString()
  studentId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
