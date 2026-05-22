import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { MarkNotificationReadImpl } from '../impl/mark-notification-read.impl';
import { ID_NOTIFICATION_REPOSITORY, NotificationRepository } from '../../../domain/repositories/notification.repository';

@CommandHandler(MarkNotificationReadImpl)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadImpl> {
  constructor(
    @Inject(ID_NOTIFICATION_REPOSITORY)
    private readonly repo: NotificationRepository,
  ) {}

  async execute(command: MarkNotificationReadImpl): Promise<void> {
    const notification = await this.repo.findById(command.notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== command.userId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    try {
      await this.repo.markAsRead(command.notificationId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to mark notification as read');
    }
  }
}
