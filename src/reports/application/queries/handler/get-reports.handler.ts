import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetReportsImpl } from '../impl/get-reports.impl';
import { ID_REPORT_REPOSITORY, ReportRepository } from '../../../domain/repositories/report.repository';
import { Report } from '../../../domain/entities/report.entity';

@QueryHandler(GetReportsImpl)
export class GetReportsHandler implements IQueryHandler<GetReportsImpl> {
  constructor(
    @Inject(ID_REPORT_REPOSITORY)
    private readonly repo: ReportRepository,
  ) {}

  async execute(_query: GetReportsImpl): Promise<Report[]> {
    return this.repo.findAll();
  }
}
