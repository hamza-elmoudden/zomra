import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteEventImpl } from "../impl/delete-event.impl";
import { Inject, NotFoundException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";

@CommandHandler(DeleteEventImpl)
export class DeleteEventHandler implements ICommandHandler<DeleteEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(command: DeleteEventImpl): Promise<void> {
    const existing = await this.repo.findById(command.id)

    if (!existing) {
      throw new NotFoundException(`Event with id ${command.id} not found`)
    }

    if (existing.host_id !== command.userId) {
      throw new ForbiddenException('Only the event host can delete this event')
    }

    try {
      await this.repo.delete(command.id)
    } catch (error) {
      throw new InternalServerErrorException('Error deleting event')
    }
  }
}
