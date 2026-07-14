import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsString()
  @IsOptional()
  location?: string;
}

export class StockMovementDto {
  @IsEnum(['in', 'out', 'adjustment'])
  type: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
