import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateConversationImpl } from "../impl/create-conversation.impl";
import { Inject } from "@nestjs/common";
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from "src/messaging/domain/repositories/conversation.repository";
import { Conversation } from "src/messaging/domain/entities/conversation.entity";

@CommandHandler(CreateConversationImpl)
export class CreateConversationHandler implements ICommandHandler<CreateConversationImpl> {

  constructor(
    @Inject(ID_CONVERSATION_REPOSITORY)
    private readonly convRepo: ConversationRepository,
  ) {}

  async execute(command: CreateConversationImpl): Promise<Conversation> {
    const user1Id = command.userId < command.recipientId ? command.userId : command.recipientId
    const user2Id = command.userId < command.recipientId ? command.recipientId : command.userId

    const existing = await this.convRepo.findByUsers(user1Id, user2Id)
    if (existing) return existing

    return this.convRepo.create(new Conversation(crypto.randomUUID(), user1Id, user2Id, command.eventId))
  }
}
