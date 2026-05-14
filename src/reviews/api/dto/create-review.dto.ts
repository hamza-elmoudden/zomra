import { IsString, IsNumber, IsOptional, Min, Max, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  reviewedUserId: string;

  @IsUUID()
  eventId: string;

  @IsNumber()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  comment?: string;
}
