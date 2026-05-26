import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateReportImpl } from '../impl/create-report.impl';
import { ID_REPORT_REPOSITORY, ReportRepository } from '../../../domain/repositories/report.repository';
import { Report } from '../../../domain/entities/report.entity';

@CommandHandler(CreateReportImpl)
export class CreateReportHandler implements ICommandHandler<CreateReportImpl> {
  constructor(
    @Inject(ID_REPORT_REPOSITORY)
    private readonly repo: ReportRepository,
  ) {}

  async execute(command: CreateReportImpl): Promise<Report> {
    if (!command.reason || command.reason.trim().length === 0) {
      throw new BadRequestException('Reason cannot be empty');
    }

    if (command.reason.length > 200) {
      throw new BadRequestException('Reason must not exceed 200 characters');
    }

    const report = new Report(
      crypto.randomUUID(),
      command.reporterId,
      command.targetType,
      command.targetId,
      command.reason.trim(),
      command.details ?? null,
      'pending' as any,
      null,
      new Date(),
      null,
    );

    try {
      return await this.repo.create(report);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create report');
    }
  }
}
