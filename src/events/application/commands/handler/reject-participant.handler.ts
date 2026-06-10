import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RejectParticipantImpl } from "../impl/reject-participant.impl";
import { Inject, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, forwardRef } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";
import { MessagingGateway } from "src/messaging/gateway/messaging.gateway";

@CommandHandler(RejectParticipantImpl)
export class RejectParticipantHandler implements ICommandHandler<RejectParticipantImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async execute(command: RejectParticipantImpl): Promise<EventParticipant> {
    const event = await this.eventRepo.findById(command.eventId)

    if (!event) {
      throw new NotFoundException(`Event with id ${command.eventId} not found`)
    }

    if (event.host_id !== command.hostId) {
      throw new ForbiddenException('Only the event host can reject participants')
    }

    const participant = await this.participantRepo.findByEventAndUser(command.eventId, command.userId)

    if (!participant) {
      throw new NotFoundException('Participant not found')
    }

    if (participant.status !== 'pending') {
      throw new BadRequestException('Participant request is not pending')
    }

    try {
      const result = await this.participantRepo.updateStatus(participant.id, 'rejected')

      this.messagingGateway.sendParticipantStatusUpdate(command.userId, {
        eventId: command.eventId,
        eventTitle: event.title,
        status: 'rejected',
      })

      return result
    } catch (error) {
      throw new InternalServerErrorException('Error rejecting participant')
    }
  }
}
