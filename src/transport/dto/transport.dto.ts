import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsString()
  vehicleNumber: string;

  @IsString()
  driverName: string;

  @IsString()
  driverPhone: string;

  @IsArray()
  stops: string[];

  @IsNumber()
  monthlyFee: number;
}

export class AssignStudentDto {
  @IsString()
  studentId: string;

  @IsString()
  routeId: string;

  @IsString()
  stopName: string;
}
