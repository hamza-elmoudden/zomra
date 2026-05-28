import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateReportHandler } from 'src/reports/application/commands/handler/create-report.handler';
import { ResolveReportHandler } from 'src/reports/application/commands/handler/resolve-report.handler';
import { GetReportsHandler } from 'src/reports/application/queries/handler/get-reports.handler';
import { ID_REPORT_REPOSITORY, ReportRepository } from 'src/reports/domain/repositories/report.repository';
import { Report } from 'src/reports/domain/entities/report.entity';
import { CreateReportImpl } from 'src/reports/application/commands/impl/create-report.impl';
import { ResolveReportImpl } from 'src/reports/application/commands/impl/resolve-report.impl';
import { GetReportsImpl } from 'src/reports/application/queries/impl/get-reports.impl';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-report-uuid'),
}));

function makeReport(overrides: Partial<Report> = {}): Report {
  return new Report(
    overrides.id ?? 'report-1',
    overrides.reporter_id ?? 'reporter-1',
    overrides.target_type ?? ('user' as any),
    overrides.target_id ?? 'target-1',
    overrides.reason ?? 'Spam',
    overrides.details ?? null,
    overrides.status ?? ('pending' as any),
    overrides.resolved_by ?? null,
    overrides.created_at ?? new Date(),
    overrides.resolved_at ?? null,
  );
}

describe('CreateReportHandler', () => {
  let handler: CreateReportHandler;
  let repo: jest.Mocked<ReportRepository>;

  beforeEach(async () => {
    repo = { create: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReportHandler,
        { provide: ID_REPORT_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<CreateReportHandler>(CreateReportHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a report successfully', async () => {
    const expected = makeReport({ id: 'generated-report-uuid', reason: 'Offensive' });
    repo.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateReportImpl('reporter-1', 'user', 'target-1', 'Offensive', 'Details here'));

    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should create a report without details', async () => {
    const expected = makeReport({ id: 'generated-report-uuid', reason: 'Spam', details: null });
    repo.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateReportImpl('reporter-1', 'event', 'event-1', 'Spam'));

    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if reason is empty', async () => {
    await expect(
      handler.execute(new CreateReportImpl('reporter-1', 'user', 'target-1', '  ')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if reason exceeds 200 chars', async () => {
    await expect(
      handler.execute(new CreateReportImpl('reporter-1', 'user', 'target-1', 'x'.repeat(201))),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    repo.create.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new CreateReportImpl('reporter-1', 'user', 'target-1', 'Spam')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('ResolveReportHandler', () => {
  let handler: ResolveReportHandler;
  let repo: jest.Mocked<ReportRepository>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResolveReportHandler,
        { provide: ID_REPORT_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<ResolveReportHandler>(ResolveReportHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should resolve report successfully', async () => {
    repo.findById.mockResolvedValue(makeReport({ id: 'r1' }));
    repo.updateStatus.mockResolvedValue(undefined);

    await handler.execute(new ResolveReportImpl('r1', 'admin-1', 'resolved'));

    expect(repo.findById).toHaveBeenCalledWith('r1');
    expect(repo.updateStatus).toHaveBeenCalledWith('r1', 'resolved', 'admin-1');
  });

  it('should dismiss report successfully', async () => {
    repo.findById.mockResolvedValue(makeReport({ id: 'r1' }));
    repo.updateStatus.mockResolvedValue(undefined);

    await handler.execute(new ResolveReportImpl('r1', 'admin-1', 'dismissed'));

    expect(repo.updateStatus).toHaveBeenCalledWith('r1', 'dismissed', 'admin-1');
  });

  it('should mark report as reviewed successfully', async () => {
    repo.findById.mockResolvedValue(makeReport({ id: 'r1' }));
    repo.updateStatus.mockResolvedValue(undefined);

    await handler.execute(new ResolveReportImpl('r1', 'admin-1', 'reviewed'));

    expect(repo.updateStatus).toHaveBeenCalledWith('r1', 'reviewed', 'admin-1');
  });

  it('should throw BadRequestException for invalid status', async () => {
    await expect(
      handler.execute(new ResolveReportImpl('r1', 'admin-1', 'pending' as any)),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if report does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ResolveReportImpl('r1', 'admin-1', 'resolved')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    repo.findById.mockResolvedValue(makeReport({ id: 'r1' }));
    repo.updateStatus.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new ResolveReportImpl('r1', 'admin-1', 'resolved')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('GetReportsHandler', () => {
  let handler: GetReportsHandler;
  let repo: jest.Mocked<ReportRepository>;

  beforeEach(async () => {
    repo = { findAll: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReportsHandler,
        { provide: ID_REPORT_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetReportsHandler>(GetReportsHandler);
  });

  it('should return all reports', async () => {
    const expected = [makeReport({ id: 'r1' }), makeReport({ id: 'r2' })];
    repo.findAll.mockResolvedValue(expected);

    const result = await handler.execute(new GetReportsImpl());
    expect(repo.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should return empty array when no reports', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await handler.execute(new GetReportsImpl());
    expect(result).toEqual([]);
  });
});
