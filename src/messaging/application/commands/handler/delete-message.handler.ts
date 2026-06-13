import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteMessageImpl } from "../impl/delete-message.impl";
import {
  Inject,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ID_MESSAGE_REPOSITORY, MessageRepository } from "src/messaging/domain/repositories/message.repository";
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from "src/messaging/domain/repositories/conversation.repository";
import { MessagingGateway } from "src/messaging/gateway/messaging.gateway";

@CommandHandler(DeleteMessageImpl)
export class DeleteMessageHandler implements ICommandHandler<DeleteMessageImpl> {

  constructor(
    @Inject(ID_MESSAGE_REPOSITORY)
    private readonly msgRepo: MessageRepository,
    @Inject(ID_CONVERSATION_REPOSITORY)
    private readonly convRepo: ConversationRepository,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async execute(command: DeleteMessageImpl): Promise<void> {
    const message = await this.msgRepo.findById(command.messageId)

    if (!message) {
      throw new NotFoundException("Message not found")
    }

    if (message.sender_id !== command.userId) {
      throw new ForbiddenException("You can only delete your own messages")
    }

    try {
      await this.msgRepo.softDelete(command.messageId)

      // ── Notify both participants the message was deleted ───────
      this.messagingGateway.sendMessageDeleted(message.conversation_id, command.messageId)
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete message")
    }
  }
}