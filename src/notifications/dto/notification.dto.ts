import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(['info', 'warning', 'success', 'error'])
  type: string;

  @IsArray()
  @IsOptional()
  recipientIds?: string[];

  @IsString()
  @IsOptional()
  recipientRole?: string;
}

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(['general', 'academic', 'event', 'holiday', 'urgent'])
  type: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;
}
