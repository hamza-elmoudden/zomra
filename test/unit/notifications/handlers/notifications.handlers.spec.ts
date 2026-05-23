import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CreateNotificationHandler } from 'src/notifications/application/commands/handler/create-notification.handler';
import { MarkNotificationReadHandler } from 'src/notifications/application/commands/handler/mark-notification-read.handler';
import { GetNotificationsHandler } from 'src/notifications/application/queries/handler/get-notifications.handler';
import { ID_NOTIFICATION_REPOSITORY, NotificationRepository } from 'src/notifications/domain/repositories/notification.repository';
import { Notification } from 'src/notifications/domain/entities/notification.entity';
import { CreateNotificationImpl } from 'src/notifications/application/commands/impl/create-notification.impl';
import { MarkNotificationReadImpl } from 'src/notifications/application/commands/impl/mark-notification-read.impl';
import { GetNotificationsImpl } from 'src/notifications/application/queries/impl/get-notifications.impl';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-notif-uuid'),
}));

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return new Notification(
    overrides.id ?? 'notif-1',
    overrides.user_id ?? 'user-1',
    overrides.type ?? ('new_message' as any),
    overrides.payload ?? {},
    overrides.is_read ?? false,
    overrides.created_at ?? new Date(),
  );
}

describe('CreateNotificationHandler', () => {
  let handler: CreateNotificationHandler;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    repo = { create: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNotificationHandler,
        { provide: ID_NOTIFICATION_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<CreateNotificationHandler>(CreateNotificationHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a notification successfully', async () => {
    const expected = makeNotification({ id: 'generated-notif-uuid', user_id: 'user-2' });
    repo.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateNotificationImpl('user-2', 'new_message', { eventId: 'e1' }));

    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should create a notification without payload', async () => {
    const expected = makeNotification({ id: 'generated-notif-uuid', user_id: 'user-2' });
    repo.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateNotificationImpl('user-2', 'event_accepted'));

    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    repo.create.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new CreateNotificationImpl('user-1', 'new_message')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('MarkNotificationReadHandler', () => {
  let handler: MarkNotificationReadHandler;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      markAsRead: jest.fn(),
    } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkNotificationReadHandler,
        { provide: ID_NOTIFICATION_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<MarkNotificationReadHandler>(MarkNotificationReadHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mark notification as read successfully', async () => {
    const notification = makeNotification({ id: 'n1', user_id: 'user-1' });
    repo.findById.mockResolvedValue(notification);
    repo.markAsRead.mockResolvedValue(undefined);

    await handler.execute(new MarkNotificationReadImpl('n1', 'user-1'));

    expect(repo.findById).toHaveBeenCalledWith('n1');
    expect(repo.markAsRead).toHaveBeenCalledWith('n1');
  });

  it('should throw NotFoundException if notification does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new MarkNotificationReadImpl('n1', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if not the owner', async () => {
    const notification = makeNotification({ id: 'n1', user_id: 'user-2' });
    repo.findById.mockResolvedValue(notification);

    await expect(
      handler.execute(new MarkNotificationReadImpl('n1', 'user-1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    const notification = makeNotification({ id: 'n1', user_id: 'user-1' });
    repo.findById.mockResolvedValue(notification);
    repo.markAsRead.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new MarkNotificationReadImpl('n1', 'user-1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('GetNotificationsHandler', () => {
  let handler: GetNotificationsHandler;
  let repo: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    repo = { findByUser: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNotificationsHandler,
        { provide: ID_NOTIFICATION_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetNotificationsHandler>(GetNotificationsHandler);
  });

  it('should return notifications for user', async () => {
    const expected = [makeNotification({ id: 'n1', user_id: 'user-1' })];
    repo.findByUser.mockResolvedValue(expected);

    const result = await handler.execute(new GetNotificationsImpl('user-1'));
    expect(repo.findByUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });

  it('should return empty array when no notifications', async () => {
    repo.findByUser.mockResolvedValue([]);

    const result = await handler.execute(new GetNotificationsImpl('user-1'));
    expect(result).toEqual([]);
  });
});
