import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ID_NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { NotificationInfrastructure } from './infrastructure/notification.infrastructure';
import { CreateNotificationHandler } from './application/commands/handler/create-notification.handler';
import { MarkNotificationReadHandler } from './application/commands/handler/mark-notification-read.handler';
import { GetNotificationsHandler } from './application/queries/handler/get-notifications.handler';
import { NotificationsController } from './api/notifications.controller';

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: ID_NOTIFICATION_REPOSITORY,
      useClass: NotificationInfrastructure,
    },
    CreateNotificationHandler,
    MarkNotificationReadHandler,
    GetNotificationsHandler,
  ],
  exports: [ID_NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
