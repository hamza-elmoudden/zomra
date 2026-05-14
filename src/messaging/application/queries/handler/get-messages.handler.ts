import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetMessagesImpl } from "../impl/get-messages.impl";
import { Inject, NotFoundException } from "@nestjs/common";
import { ID_MESSAGE_REPOSITORY, MessageRepository } from "src/messaging/domain/repositories/message.repository";
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from "src/messaging/domain/repositories/conversation.repository";
import { Message } from "src/messaging/domain/entities/message.entity";

@QueryHandler(GetMessagesImpl)
export class GetMessagesHandler implements IQueryHandler<GetMessagesImpl> {

  constructor(
    @Inject(ID_MESSAGE_REPOSITORY)
    private readonly msgRepo: MessageRepository,
    @Inject(ID_CONVERSATION_REPOSITORY)
    private readonly convRepo: ConversationRepository,
  ) {}

  async execute(query: GetMessagesImpl): Promise<Message[]> {
    const conversation = await this.convRepo.findById(query.conversationId)
    if (!conversation) {
      throw new NotFoundException("Conversation not found")
    }

    return this.msgRepo.findByConversationId(query.conversationId)
  }
}
