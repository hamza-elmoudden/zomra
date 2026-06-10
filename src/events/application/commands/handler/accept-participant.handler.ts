import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AcceptParticipantImpl } from "../impl/accept-participant.impl";
import { Inject, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, forwardRef } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";
import { MessagingGateway } from "src/messaging/gateway/messaging.gateway";

@CommandHandler(AcceptParticipantImpl)
export class AcceptParticipantHandler implements ICommandHandler<AcceptParticipantImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
  ) {}

  async execute(command: AcceptParticipantImpl): Promise<EventParticipant> {
    const event = await this.eventRepo.findById(command.eventId)

    if (!event) {
      throw new NotFoundException(`Event with id ${command.eventId} not found`)
    }

    if (event.host_id !== command.hostId) {
      throw new ForbiddenException('Only the event host can accept participants')
    }

    const participant = await this.participantRepo.findByEventAndUser(command.eventId, command.userId)

    if (!participant) {
      throw new NotFoundException('Participant not found')
    }

    if (participant.status !== 'pending') {
      throw new BadRequestException('Participant request is not pending')
    }

    const currentAccepted = await this.participantRepo.countByEventId(command.eventId)

    if (currentAccepted >= event.max_participants) {
      throw new BadRequestException('Event has reached maximum participants')
    }

    try {
      const result = await this.participantRepo.updateStatus(participant.id, 'accepted')

      const acceptedCount = await this.participantRepo.countByEventId(command.eventId)
      await this.eventRepo.update(command.eventId, { current_count: acceptedCount } as any)

      this.messagingGateway.sendParticipantStatusUpdate(command.userId, {
        eventId: command.eventId,
        eventTitle: event.title,
        status: 'accepted',
      })

      return result
    } catch (error) {
      throw new InternalServerErrorException('Error accepting participant')
    }
  }
}
