import { Message } from "../entities/message.entity";

export const ID_MESSAGE_REPOSITORY = "ID_MESSAGE_REPOSITORY";

export abstract class MessageRepository {
  abstract create(data: Message): Promise<Message>
  abstract findByConversationId(conversationId: string): Promise<Message[]>
  abstract findById(id: string): Promise<Message | null>
  abstract softDelete(id: string): Promise<void>
}
