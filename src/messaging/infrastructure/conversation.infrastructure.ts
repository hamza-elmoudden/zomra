import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Conversation } from "../domain/entities/conversation.entity";
import { ConversationRepository } from "../domain/repositories/conversation.repository";

@Injectable()
export class ConversationInfrastructure implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SELECT = {
    id: true, user_1_id: true, user_2_id: true, event_id: true,
    created_at: true, last_message_at: true,
  } as const;

  private mapToConversation(data: any): Conversation {
    return new Conversation(
      data.id,
      data.user_1_id,
      data.user_2_id,
      data.event_id ?? undefined,
      data.created_at ?? undefined,
      data.last_message_at ?? undefined,
    )
  }

  async create(data: Conversation): Promise<Conversation> {
    try {
      const result = await this.prisma.conversations.create({
        data: {
          user_1_id: data.user_1_id,
          user_2_id: data.user_2_id,
          event_id: data.event_id,
        },
      })
      return this.mapToConversation(result)
    } catch (error) {
      throw new InternalServerErrorException("Failed to create conversation")
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    try {
      const data = await this.prisma.conversations.findUnique({
        where: { id },
        select: this.SELECT,
      })
      return data ? this.mapToConversation(data) : null
    } catch (error) {
      throw new InternalServerErrorException("Failed to find conversation")
    }
  }

  async findByUsers(user1Id: string, user2Id: string): Promise<Conversation | null> {
    try {
      const data = await this.prisma.conversations.findUnique({
        where: {
          user_1_id_user_2_id: { user_1_id: user1Id, user_2_id: user2Id },
        },
        select: this.SELECT,
      })
      return data ? this.mapToConversation(data) : null
    } catch (error) {
      throw new InternalServerErrorException("Failed to find conversation")
    }
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    try {
      const data = await this.prisma.conversations.findMany({
        where: {
          OR: [{ user_1_id: userId }, { user_2_id: userId }],
        },
        select: this.SELECT,
        orderBy: { last_message_at: "desc" },
      })
      return data.map((c) => this.mapToConversation(c))
    } catch (error) {
      throw new InternalServerErrorException("Failed to find conversations")
    }
  }

  async updateLastMessageAt(id: string, lastMessageAt: Date): Promise<void> {
    try {
      await this.prisma.conversations.update({
        where: { id },
        data: { last_message_at: lastMessageAt },
      })
    } catch (error) {
      throw new InternalServerErrorException("Failed to update last message at")
    }
  }
}
