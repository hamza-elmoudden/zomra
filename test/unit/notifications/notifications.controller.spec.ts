import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { NotificationsController } from 'src/notifications/api/notifications.controller';
import { User } from 'src/users/domain/entities/user.entity';
import { GetNotificationsImpl } from 'src/notifications/application/queries/impl/get-notifications.impl';
import { MarkNotificationReadImpl } from 'src/notifications/application/commands/impl/mark-notification-read.impl';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('getNotifications', () => {
    it('should execute GetNotificationsImpl', async () => {
      const expected = [{ id: 'n1' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getNotifications(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetNotificationsImpl('user-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('markAsRead', () => {
    it('should execute MarkNotificationReadImpl', async () => {
      await controller.markAsRead('notif-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new MarkNotificationReadImpl('notif-1', 'user-1'));
    });
  });
});
