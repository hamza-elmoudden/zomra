import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { report_status } from 'generated/prisma/enums';
import { ResolveReportImpl } from '../impl/resolve-report.impl';
import { ID_REPORT_REPOSITORY, ReportRepository } from '../../../domain/repositories/report.repository';

@CommandHandler(ResolveReportImpl)
export class ResolveReportHandler implements ICommandHandler<ResolveReportImpl> {
  constructor(
    @Inject(ID_REPORT_REPOSITORY)
    private readonly repo: ReportRepository,
  ) {}

  async execute(command: ResolveReportImpl): Promise<void> {
    const validStatuses: report_status[] = ['reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(command.status)) {
      throw new BadRequestException(`Invalid status: ${command.status}`);
    }

    const report = await this.repo.findById(command.reportId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    try {
      await this.repo.updateStatus(command.reportId, command.status, command.resolvedBy);
    } catch (error) {
      throw new InternalServerErrorException('Failed to resolve report');
    }
  }
}
