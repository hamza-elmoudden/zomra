import { Notification } from '../entities/notification.entity';

export const ID_NOTIFICATION_REPOSITORY = 'ID_NOTIFICATION_REPOSITORY';

export abstract class NotificationRepository {
  abstract create(data: Notification): Promise<Notification>;
  abstract findByUser(userId: string): Promise<Notification[]>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract markAsRead(id: string): Promise<void>;
  abstract markAllAsRead(userId: string): Promise<void>;
  abstract countUnreadByUser(userId: string): Promise<number>;
}
