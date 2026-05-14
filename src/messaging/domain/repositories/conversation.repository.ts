import { Conversation } from "../entities/conversation.entity";

export const ID_CONVERSATION_REPOSITORY = "ID_CONVERSATION_REPOSITORY";

export abstract class ConversationRepository {
  abstract create(data: Conversation): Promise<Conversation>
  abstract findById(id: string): Promise<Conversation | null>
  abstract findByUsers(user1Id: string, user2Id: string): Promise<Conversation | null>
  abstract findByUserId(userId: string): Promise<Conversation[]>
  abstract updateLastMessageAt(id: string, lastMessageAt: Date): Promise<void>
}
