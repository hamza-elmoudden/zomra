import { IsString, IsUUID, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { report_target } from 'generated/prisma/enums';

const targetValues = Object.values(report_target);

export class CreateReportDto {
  @IsString()
  @IsIn(targetValues, { message: 'Invalid target type' })
  targetType: string;

  @IsUUID()
  targetId: string;

  @IsString()
  @MinLength(1, { message: 'Reason cannot be empty' })
  @MaxLength(200, { message: 'Reason must not exceed 200 characters' })
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}
