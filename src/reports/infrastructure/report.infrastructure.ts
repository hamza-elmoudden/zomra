import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { report_status } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { Report } from '../domain/entities/report.entity';
import { ReportRepository } from '../domain/repositories/report.repository';

@Injectable()
export class ReportInfrastructure implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SELECT = {
    id: true, reporter_id: true, target_type: true, target_id: true,
    reason: true, details: true, status: true, resolved_by: true,
    created_at: true, resolved_at: true,
  } as const;

  private mapToReport(data: any): Report {
    return new Report(
      data.id,
      data.reporter_id,
      data.target_type,
      data.target_id,
      data.reason,
      data.details,
      data.status,
      data.resolved_by,
      data.created_at,
      data.resolved_at,
    );
  }

  async create(data: Report): Promise<Report> {
    try {
      const result = await this.prisma.reports.create({
        data: {
          reporter_id: data.reporter_id,
          target_type: data.target_type,
          target_id: data.target_id,
          reason: data.reason,
          details: data.details,
        },
      });
      return this.mapToReport(result);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  async findAll(): Promise<Report[]> {
    try {
      const data = await this.prisma.reports.findMany({
        select: this.SELECT,
        orderBy: { created_at: 'desc' },
      });
      return data.map((r) => this.mapToReport(r));
    } catch (error) {
      throw new InternalServerErrorException('Failed to find reports');
    }
  }

  async findById(id: string): Promise<Report | null> {
    try {
      const data = await this.prisma.reports.findUnique({
        where: { id },
        select: this.SELECT,
      });
      return data ? this.mapToReport(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find report');
    }
  }

  async updateStatus(id: string, status: report_status, resolvedBy: string): Promise<void> {
    try {
      await this.prisma.reports.update({
        where: { id },
        data: {
          status,
          resolved_by: resolvedBy,
          resolved_at: status === 'resolved' || status === 'dismissed' ? new Date() : null,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update report status');
    }
  }
}
