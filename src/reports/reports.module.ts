import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ID_REPORT_REPOSITORY } from './domain/repositories/report.repository';
import { ReportInfrastructure } from './infrastructure/report.infrastructure';
import { CreateReportHandler } from './application/commands/handler/create-report.handler';
import { ResolveReportHandler } from './application/commands/handler/resolve-report.handler';
import { GetReportsHandler } from './application/queries/handler/get-reports.handler';
import { ReportsController } from './api/reports.controller';

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: ID_REPORT_REPOSITORY,
      useClass: ReportInfrastructure,
    },
    CreateReportHandler,
    ResolveReportHandler,
    GetReportsHandler,
  ],
  exports: [ID_REPORT_REPOSITORY],
})
export class ReportsModule {}
