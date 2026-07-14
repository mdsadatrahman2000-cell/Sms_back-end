import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeeStructureDto {
  @IsString()
  name: string;

  @IsString()
  classId: string;

  @IsString()
  academicYearId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeItemDto)
  items: FeeItemDto[];
}

export class FeeItemDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;
}

export class CreateInvoiceDto {
  @IsString()
  studentId: string;

  @IsString()
  feeStructureId: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class RecordPaymentDto {
  @IsString()
  invoiceId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['cash', 'card', 'bank_transfer', 'online', 'cheque'])
  method: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
