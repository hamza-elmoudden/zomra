import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UpdateEventImpl } from "../impl/update-event.impl";
import { Inject, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { event_status } from "generated/prisma/enums";
import { Events } from "src/events/domain/entities/events.entities";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'cancelled'],
  open: ['full', 'cancelled'],
  full: ['open', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

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

    if (command.status && command.status !== existing.status) {
      const allowed = ALLOWED_TRANSITIONS[existing.status] ?? []
      if (!allowed.includes(command.status)) {
        throw new BadRequestException(
          `Cannot transition event from '${existing.status}' to '${command.status}'`,
        )
      }
    }

    try {
      return await this.repo.update(command.id, command)
    } catch (error) {
      throw new InternalServerErrorException('Error updating event')
    }
  }
}
