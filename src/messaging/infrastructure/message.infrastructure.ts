import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Message } from "../domain/entities/message.entity";
import { MessageRepository } from "../domain/repositories/message.repository";

@Injectable()
export class MessageInfrastructure implements MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToMessage(data: any): Message {
    return new Message(
      data.id,
      data.conversation_id,
      data.sender_id,
      data.content,
      data.is_read,
      data.is_deleted,
      data.sent_at,
    )
  }

  async create(data: Message): Promise<Message> {
    try {
      const result = await this.prisma.messages.create({
        data: {
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          content: data.content,
        },
      })
      return this.mapToMessage(result)
    } catch (error) {
      throw new InternalServerErrorException("Failed to create message")
    }
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    try {
      const data = await this.prisma.messages.findMany({
        where: { conversation_id: conversationId, is_deleted: false },
        orderBy: { sent_at: "asc" },
      })
      return data.map((m) => this.mapToMessage(m))
    } catch (error) {
      throw new InternalServerErrorException("Failed to find messages")
    }
  }

  async findById(id: string): Promise<Message | null> {
    try {
      const data = await this.prisma.messages.findUnique({ where: { id } })
      return data ? this.mapToMessage(data) : null
    } catch (error) {
      throw new InternalServerErrorException("Failed to find message")
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.messages.update({
        where: { id },
        data: { is_deleted: true },
      })
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete message")
    }
  }
}
