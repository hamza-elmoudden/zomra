import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SendMessageImpl } from "../impl/send-message.impl";
import { Inject, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from "src/messaging/domain/repositories/conversation.repository";
import { ID_MESSAGE_REPOSITORY, MessageRepository } from "src/messaging/domain/repositories/message.repository";
import { Message } from "src/messaging/domain/entities/message.entity";

@CommandHandler(SendMessageImpl)
export class SendMessageHandler implements ICommandHandler<SendMessageImpl> {

  constructor(
    @Inject(ID_CONVERSATION_REPOSITORY)
    private readonly convRepo: ConversationRepository,
    @Inject(ID_MESSAGE_REPOSITORY)
    private readonly msgRepo: MessageRepository,
  ) {}

  async execute(command: SendMessageImpl): Promise<Message> {
    if (!command.content || command.content.trim().length === 0) {
      throw new BadRequestException("Message content cannot be empty")
    }

    const conversation = await this.convRepo.findById(command.conversationId)
    if (!conversation) {
      throw new NotFoundException("Conversation not found")
    }

    if (conversation.user_1_id !== command.senderId && conversation.user_2_id !== command.senderId) {
      throw new ForbiddenException("You are not a participant of this conversation")
    }

    const message = new Message(
      crypto.randomUUID(),
      command.conversationId,
      command.senderId,
      command.content.trim(),
      false,
      false,
      new Date(),
    )

    try {
      const result = await this.msgRepo.create(message)
      await this.convRepo.updateLastMessageAt(command.conversationId, message.sent_at)
      return result
    } catch (error) {
      throw new InternalServerErrorException("Failed to send message")
    }
  }
}
