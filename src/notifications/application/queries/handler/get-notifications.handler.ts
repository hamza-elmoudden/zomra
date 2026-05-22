import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetNotificationsImpl } from '../impl/get-notifications.impl';
import { ID_NOTIFICATION_REPOSITORY, NotificationRepository } from '../../../domain/repositories/notification.repository';
import { Notification } from '../../../domain/entities/notification.entity';

@QueryHandler(GetNotificationsImpl)
export class GetNotificationsHandler implements IQueryHandler<GetNotificationsImpl> {
  constructor(
    @Inject(ID_NOTIFICATION_REPOSITORY)
    private readonly repo: NotificationRepository,
  ) {}

  async execute(query: GetNotificationsImpl): Promise<Notification[]> {
    return this.repo.findByUser(query.userId);
  }
}
