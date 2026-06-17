import { Conversation } from "../entities/conversation.entity";

export const ID_CONVERSATION_REPOSITORY = "ID_CONVERSATION_REPOSITORY";

/**
 * One conversation per user pair, regardless of event.
 * `event_id` is metadata-only — it records which event triggered the
 * conversation but does NOT scope lookups. The DB unique constraint
 * (user_1_id_user_2_id) enforces a single row per pair.
 */
export abstract class ConversationRepository {
  abstract create(data: Conversation): Promise<Conversation>
  abstract findById(id: string): Promise<Conversation | null>
  abstract findByUsers(user1Id: string, user2Id: string): Promise<Conversation | null>
  abstract findByUserId(userId: string): Promise<Conversation[]>
  abstract updateLastMessageAt(id: string, lastMessageAt: Date): Promise<void>
}
