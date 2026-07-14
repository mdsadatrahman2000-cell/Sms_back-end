import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  isbn: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  shelfLocation?: string;
}

export class IssueBookDto {
  @IsString()
  bookId: string;

  @IsString()
  studentId: string;

  @IsDateString()
  dueDate: string;
}

export class ReturnBookDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}
