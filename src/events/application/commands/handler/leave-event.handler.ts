import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { LeaveEventImpl } from "../impl/leave-event.impl";
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";

@CommandHandler(LeaveEventImpl)
export class LeaveEventHandler implements ICommandHandler<LeaveEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
  ) {}

  async execute(command: LeaveEventImpl): Promise<void> {
    const event = await this.eventRepo.findById(command.eventId)

    if (!event) {
      throw new NotFoundException(`Event with id ${command.eventId} not found`)
    }

    const participant = await this.participantRepo.findByEventAndUser(command.eventId, command.userId)

    if (!participant) {
      throw new NotFoundException('You are not a participant of this event')
    }

    try {
      await this.participantRepo.delete(participant.id)

      const currentAccepted = await this.participantRepo.countByEventId(command.eventId)
      const newStatus = event.status === 'full' && currentAccepted < event.max_participants
        ? 'open'
        : event.status
      await this.eventRepo.update(command.eventId, { current_count: currentAccepted, status: newStatus } as any)
    } catch (error) {
      throw new InternalServerErrorException('Error leaving event')
    }
  }
}
