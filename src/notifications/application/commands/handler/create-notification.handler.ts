import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, InternalServerErrorException } from '@nestjs/common';
import { CreateNotificationImpl } from '../impl/create-notification.impl';
import { ID_NOTIFICATION_REPOSITORY, NotificationRepository } from '../../../domain/repositories/notification.repository';
import { Notification } from '../../../domain/entities/notification.entity';

@CommandHandler(CreateNotificationImpl)
export class CreateNotificationHandler implements ICommandHandler<CreateNotificationImpl> {
  constructor(
    @Inject(ID_NOTIFICATION_REPOSITORY)
    private readonly repo: NotificationRepository,
  ) {}

  async execute(command: CreateNotificationImpl): Promise<Notification> {
    const notification = new Notification(
      crypto.randomUUID(),
      command.userId,
      command.type,
      command.payload ?? {},
      false,
      new Date(),
    );

    try {
      return await this.repo.create(notification);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create notification');
    }
  }
}
