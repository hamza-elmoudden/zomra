import { IsString, IsNumber, IsDateString, IsOptional, Min, MinLength, MaxLength, IsBoolean, IsEnum } from 'class-validator';
import { event_status } from 'generated/prisma/enums';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsEnum(event_status)
  status?: event_status;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
