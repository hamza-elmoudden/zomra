import { IsString, IsIn } from 'class-validator';
import { report_status } from 'generated/prisma/enums';

const statusValues = ['reviewed', 'resolved', 'dismissed'];

export class ResolveReportDto {
  @IsString()
  @IsIn(statusValues, { message: 'Status must be reviewed, resolved, or dismissed' })
  status: string;
}
