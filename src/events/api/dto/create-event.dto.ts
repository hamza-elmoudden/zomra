import { IsString, IsNumber, IsDateString, IsOptional, Min, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(120, { message: 'Title must not exceed 120 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @MinLength(2, { message: 'Category must be at least 2 characters' })
  @MaxLength(60)
  category: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsNumber()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Must have at least 1 participant' })
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
  @IsBoolean()
  isPublic?: boolean;
}
