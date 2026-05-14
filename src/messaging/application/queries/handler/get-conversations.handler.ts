import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetConversationsImpl } from "../impl/get-conversations.impl";
import { Inject } from "@nestjs/common";
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from "src/messaging/domain/repositories/conversation.repository";
import { Conversation } from "src/messaging/domain/entities/conversation.entity";

@QueryHandler(GetConversationsImpl)
export class GetConversationsHandler implements IQueryHandler<GetConversationsImpl> {

  constructor(
    @Inject(ID_CONVERSATION_REPOSITORY)
    private readonly repo: ConversationRepository,
  ) {}

  async execute(query: GetConversationsImpl): Promise<Conversation[]> {
    return this.repo.findByUserId(query.userId)
  }
}
