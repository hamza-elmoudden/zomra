import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { GroupMessage } from "../domain/entities/group-message.entity";
import { GroupMessageRepository } from "../domain/repositories/group-message.repository";

@Injectable()
export class GroupMessageInfrastructure implements GroupMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SELECT = {
    id: true, event_id: true, sender_id: true, content: true,
    is_deleted: true, sent_at: true,
  } as const;

  private mapToGroupMessage(data: any): GroupMessage {
    return new GroupMessage(
      data.id,
      data.event_id,
      data.sender_id,
      data.content,
      data.is_deleted,
      data.sent_at,
    )
  }

  async create(data: GroupMessage): Promise<GroupMessage> {
    try {
      const result = await this.prisma.group_event_messages.create({
        data: {
          event_id: data.event_id,
          sender_id: data.sender_id,
          content: data.content,
        },
      })
      return this.mapToGroupMessage(result)
    } catch (error) {
      throw new InternalServerErrorException("Failed to create group message")
    }
  }

  async findByEventId(eventId: string): Promise<GroupMessage[]> {
    try {
      const data = await this.prisma.group_event_messages.findMany({
        where: { event_id: eventId, is_deleted: false },
        select: this.SELECT,
        orderBy: { sent_at: "asc" },
      })
      return data.map((m) => this.mapToGroupMessage(m))
    } catch (error) {
      throw new InternalServerErrorException("Failed to find group messages")
    }
  }

  async findById(id: string): Promise<GroupMessage | null> {
    try {
      const data = await this.prisma.group_event_messages.findUnique({
        where: { id },
        select: this.SELECT,
      })
      return data ? this.mapToGroupMessage(data) : null
    } catch (error) {
      throw new InternalServerErrorException("Failed to find group message")
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.group_event_messages.update({
        where: { id },
        data: { is_deleted: true },
      })
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete group message")
    }
  }
}
