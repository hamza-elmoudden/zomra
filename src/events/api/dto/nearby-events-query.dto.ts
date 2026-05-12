import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyEventsQueryDto {
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusKm?: number;
}
