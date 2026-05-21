import { notification_type } from 'generated/prisma/enums';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly type: notification_type,
    public readonly payload: Record<string, any>,
    public readonly is_read: boolean,
    public readonly created_at: Date,
  ) {}
}
