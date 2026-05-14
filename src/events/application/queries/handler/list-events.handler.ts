import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ListEventsImpl } from "../impl/list-events.impl";
import { Inject } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@QueryHandler(ListEventsImpl)
export class ListEventsHandler implements IQueryHandler<ListEventsImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(query: ListEventsImpl): Promise<Events[]> {
    return this.repo.findAll({
      city: query.city,
      category: query.category,
      status: query.status,
      page: query.page,
      limit: query.limit,
    })
  }
}
