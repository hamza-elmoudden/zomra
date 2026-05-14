import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UpdateEventImpl } from "../impl/update-event.impl";
import { Inject, NotFoundException, ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@CommandHandler(UpdateEventImpl)
export class UpdateEventHandler implements ICommandHandler<UpdateEventImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(command: UpdateEventImpl): Promise<Events> {
    const existing = await this.repo.findById(command.id)

    if (!existing) {
      throw new NotFoundException(`Event with id ${command.id} not found`)
    }

    try {
      return await this.repo.update(command.id, command)
    } catch (error) {
      throw new InternalServerErrorException('Error updating event')
    }
  }
}
