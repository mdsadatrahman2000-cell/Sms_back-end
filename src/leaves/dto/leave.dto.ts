import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateLeaveDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
