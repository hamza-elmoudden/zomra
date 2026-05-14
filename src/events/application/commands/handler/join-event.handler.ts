import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { JoinEventImpl } from "../impl/join-event.impl";
import { Inject, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";

@CommandHandler(JoinEventImpl)
export class JoinEventHandler implements ICommandHandler<JoinEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
  ) {}

  async execute(command: JoinEventImpl): Promise<EventParticipant> {
    const event = await this.eventRepo.findById(command.eventId)

    if (!event) {
      throw new NotFoundException(`Event with id ${command.eventId} not found`)
    }

    if (event.status !== 'open') {
      throw new BadRequestException('Event is not open for joining')
    }

    if (event.host_id === command.userId) {
      throw new BadRequestException('You cannot join your own event')
    }

    const existing = await this.participantRepo.findByEventAndUser(command.eventId, command.userId)

    if (existing) {
      throw new ConflictException('You are already a participant of this event')
    }

    const currentAccepted = await this.participantRepo.countByEventId(command.eventId)

    if (currentAccepted >= event.max_participants) {
      throw new BadRequestException('Event has reached maximum participants')
    }

    const participant = new EventParticipant(
      crypto.randomUUID(),
      command.eventId,
      command.userId,
      'pending',
      new Date(),
    )

    try {
      const result = await this.participantRepo.create(participant)

      await this.eventRepo.update(command.eventId, { current_count: currentAccepted + 1 } as any)

      return result
    } catch (error) {
      throw new InternalServerErrorException('Error joining event')
    }
  }
}
