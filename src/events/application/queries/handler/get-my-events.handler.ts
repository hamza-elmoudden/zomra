import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetMyEventsImpl } from "../impl/get-my-events.impl";
import { Inject } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@QueryHandler(GetMyEventsImpl)
export class GetMyEventsHandler implements IQueryHandler<GetMyEventsImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(query: GetMyEventsImpl): Promise<Events[]> {
    return this.repo.findByUser(query.userId)
  }
}
