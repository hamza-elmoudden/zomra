import { notification_type } from 'generated/prisma/enums';

export class CreateNotificationImpl {
  constructor(
    public readonly userId: string,
    public readonly type: notification_type,
    public readonly payload?: Record<string, any>,
  ) {}
}
