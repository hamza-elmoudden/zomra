import { IsOptional, IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
