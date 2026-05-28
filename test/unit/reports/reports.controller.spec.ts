import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ReportsController } from 'src/reports/api/reports.controller';
import { User } from 'src/users/domain/entities/user.entity';
import { CreateReportImpl } from 'src/reports/application/commands/impl/create-report.impl';
import { ResolveReportImpl } from 'src/reports/application/commands/impl/resolve-report.impl';
import { GetReportsImpl } from 'src/reports/application/queries/impl/get-reports.impl';

describe('ReportsController', () => {
  let controller: ReportsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('create', () => {
    it('should execute CreateReportImpl with details', async () => {
      const dto = { targetType: 'user', targetId: 'target-1', reason: 'Offensive behavior', details: 'Spamming in chat' };
      const expected = { id: 'report-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateReportImpl('user-1', 'user', 'target-1', 'Offensive behavior', 'Spamming in chat'),
      );
      expect(result).toEqual(expected);
    });

    it('should execute CreateReportImpl without optional details', async () => {
      const dto = { targetType: 'event', targetId: 'event-1', reason: 'Inappropriate content' };
      commandBus.execute.mockResolvedValue({ id: 'report-2' });

      await controller.create(dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateReportImpl('user-1', 'event', 'event-1', 'Inappropriate content', undefined),
      );
    });
  });

  describe('findAll', () => {
    it('should execute GetReportsImpl', async () => {
      const expected = [{ id: 'r1' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.findAll();
      expect(queryBus.execute).toHaveBeenCalledWith(new GetReportsImpl());
      expect(result).toEqual(expected);
    });
  });

  describe('resolve', () => {
    it('should execute ResolveReportImpl', async () => {
      const dto = { status: 'resolved' };
      await controller.resolve('report-1', dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new ResolveReportImpl('report-1', 'user-1', 'resolved'),
      );
    });
  });
});
