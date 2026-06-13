import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { SendGroupMessageImpl } from "../impl/send-group-message.impl";
import {
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ID_GROUP_MESSAGE_REPOSITORY, GroupMessageRepository } from "src/messaging/domain/repositories/group-message.repository";
import { GroupMessage } from "src/messaging/domain/entities/group-message.entity";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { MessagingGateway } from "src/messaging/gateway/messaging.gateway";

@CommandHandler(SendGroupMessageImpl)
export class SendGroupMessageHandler implements ICommandHandler<SendGroupMessageImpl> {

  constructor(
    @Inject(ID_GROUP_MESSAGE_REPOSITORY)
    private readonly groupMsgRepo: GroupMessageRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async execute(command: SendGroupMessageImpl): Promise<GroupMessage> {
    if (!command.content || command.content.trim().length === 0) {
      throw new BadRequestException("Message content cannot be empty")
    }

    const event = await this.eventRepo.findById(command.eventId)
    if (!event) {
      throw new NotFoundException("Event not found")
    }

    const participant = await this.participantRepo.findByEventAndUser(command.eventId, command.senderId)
    if (!participant || participant.status !== "accepted") {
      throw new ForbiddenException("You must be an accepted participant to send group messages")
    }

    const message = new GroupMessage(
      crypto.randomUUID(),
      command.eventId,
      command.senderId,
      command.content.trim(),
      false,
      new Date(),
    )

    try {
      const saved = await this.groupMsgRepo.create(message)

      // ── Broadcast to everyone in the event room ────────────────
      this.messagingGateway.sendNewGroupMessage(command.eventId, saved)

      return saved
    } catch (error) {
      throw new InternalServerErrorException("Failed to send group message")
    }
  }
}