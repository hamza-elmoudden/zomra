import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ObserverGuard } from 'src/admin/guards/observer.guard';
import { CurrentUser } from 'src/auth/decorators/decorators';
import { User } from 'src/users/domain/entities/user.entity';
import { Report } from '../domain/entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CreateReportImpl } from '../application/commands/impl/create-report.impl';
import { ResolveReportImpl } from '../application/commands/impl/resolve-report.impl';
import { GetReportsImpl } from '../application/queries/impl/get-reports.impl';

@Controller()
export class ReportsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: User,
  ): Promise<Report> {
    return this.commandBus.execute(
      new CreateReportImpl(user.id, dto.targetType as any, dto.targetId, dto.reason, dto.details),
    );
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async findAll(): Promise<Report[]> {
    return this.queryBus.execute(new GetReportsImpl());
  }

  @Patch('reports/:id')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new ResolveReportImpl(id, user.id, dto.status as any));
  }
}
