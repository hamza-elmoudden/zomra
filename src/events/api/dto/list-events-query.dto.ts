import { IsOptional, IsString, IsNumber, Min, IsEnum, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { event_status } from 'generated/prisma/enums';

export class ListEventsQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(event_status)
  status?: event_status;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
