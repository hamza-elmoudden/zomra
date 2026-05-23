import { report_status } from 'generated/prisma/enums';
import { Report } from '../entities/report.entity';

export const ID_REPORT_REPOSITORY = 'ID_REPORT_REPOSITORY';

export abstract class ReportRepository {
  abstract create(data: Report): Promise<Report>;
  abstract findAll(): Promise<Report[]>;
  abstract findById(id: string): Promise<Report | null>;
  abstract updateStatus(id: string, status: report_status, resolvedBy: string): Promise<void>;
}
