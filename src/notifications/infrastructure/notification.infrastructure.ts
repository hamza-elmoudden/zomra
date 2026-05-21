import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification } from '../domain/entities/notification.entity';
import { NotificationRepository } from '../domain/repositories/notification.repository';

@Injectable()
export class NotificationInfrastructure implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToNotification(data: any): Notification {
    return new Notification(
      data.id,
      data.user_id,
      data.type,
      data.payload as Record<string, any>,
      data.is_read,
      data.created_at,
    );
  }

  async create(data: Notification): Promise<Notification> {
    try {
      const result = await this.prisma.notifications.create({
        data: {
          user_id: data.user_id,
          type: data.type,
          payload: data.payload ?? {},
        },
      });
      return this.mapToNotification(result);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  async findByUser(userId: string): Promise<Notification[]> {
    try {
      const data = await this.prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: [{ is_read: 'asc' }, { created_at: 'desc' }],
      });
      return data.map((n) => this.mapToNotification(n));
    } catch (error) {
      throw new InternalServerErrorException('Failed to find notifications');
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      const data = await this.prisma.notifications.findUnique({ where: { id } });
      return data ? this.mapToNotification(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find notification');
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await this.prisma.notifications.update({
        where: { id },
        data: { is_read: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.prisma.notifications.updateMany({
        where: { user_id: userId, is_read: false },
        data: { is_read: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to mark notifications as read');
    }
  }

  async countUnreadByUser(userId: string): Promise<number> {
    try {
      return await this.prisma.notifications.count({
        where: { user_id: userId, is_read: false },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to count unread notifications');
    }
  }
}
