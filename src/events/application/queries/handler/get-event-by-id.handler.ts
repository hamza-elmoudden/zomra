import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetEventByIdImpl } from "../impl/get-event-by-id.impl";
import { Inject, NotFoundException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@QueryHandler(GetEventByIdImpl)
export class GetEventByIdHandler implements IQueryHandler<GetEventByIdImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(query: GetEventByIdImpl): Promise<Events> {
    const event = await this.repo.findById(query.id)

    if (!event) {
      throw new NotFoundException(`Event with id ${query.id} not found`)
    }

    return event
  }
}
