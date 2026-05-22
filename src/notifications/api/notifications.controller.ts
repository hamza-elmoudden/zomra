import { Controller, Get, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/decorators';
import { User } from 'src/users/domain/entities/user.entity';
import { Notification } from '../domain/entities/notification.entity';
import { GetNotificationsImpl } from '../application/queries/impl/get-notifications.impl';
import { MarkNotificationReadImpl } from '../application/commands/impl/mark-notification-read.impl';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('notifications')
  async getNotifications(@CurrentUser() user: User): Promise<Notification[]> {
    return this.queryBus.execute(new GetNotificationsImpl(user.id));
  }

  @Patch('notifications/:id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new MarkNotificationReadImpl(id, user.id));
  }
}
