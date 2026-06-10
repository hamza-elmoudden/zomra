import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { JoinEventImpl } from "../impl/join-event.impl";
import { Inject, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException, forwardRef } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { ID_USER_REPOSITORY, UserRepository } from "src/users/domain/repositories/user.repository";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";
import { MessagingGateway } from "src/messaging/gateway/messaging.gateway";

@CommandHandler(JoinEventImpl)
export class JoinEventHandler implements ICommandHandler<JoinEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
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

      const user = await this.userRepo.findById(command.userId)
      const userName = user?.full_name || user?.username || command.userId

      this.messagingGateway.sendEventJoinRequest(command.eventId, event.host_id, {
        userId: command.userId,
        userName,
        eventTitle: event.title,
      })

      return result
    } catch (error) {
      throw new InternalServerErrorException('Error joining event')
    }
  }
}
