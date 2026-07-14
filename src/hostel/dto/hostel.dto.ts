import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateHostelDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsOptional()
  wardenName?: string;

  @IsString()
  @IsOptional()
  wardenPhone?: string;
}

export class CreateRoomDto {
  @IsString()
  hostelId: string;

  @IsString()
  roomNumber: string;

  @IsEnum(['single', 'double', 'triple', 'dormitory'])
  type: string;

  @IsNumber()
  capacity: number;

  @IsNumber()
  @IsOptional()
  monthlyFee?: number;
}

export class AssignRoomDto {
  @IsString()
  studentId: string;

  @IsString()
  roomId: string;
}
