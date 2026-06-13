import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteEventImpl } from "../impl/delete-event.impl";
import { Inject, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";

@CommandHandler(DeleteEventImpl)
export class DeleteEventHandler implements ICommandHandler<DeleteEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
  ) {}

  async execute(command: DeleteEventImpl): Promise<void> {
    const existing = await this.repo.findById(command.id)

    if (!existing) {
      throw new NotFoundException(`Event with id ${command.id} not found`)
    }

    if (existing.host_id !== command.userId) {
      throw new ForbiddenException('Only the event host can delete this event')
    }

    const eventEnd = new Date(existing.starts_at.getTime() + existing.duration_minutes * 60000)
    if (eventEnd < new Date()) {
      const participantCount = await this.participantRepo.countByEventId(command.id)
      if (participantCount > 0) {
        throw new BadRequestException('Cannot delete an event that has ended and has participants')
      }
    }

    try {
      await this.repo.delete(command.id)
    } catch (error) {
      throw new InternalServerErrorException('Error deleting event')
    }
  }
}
