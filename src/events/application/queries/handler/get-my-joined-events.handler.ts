import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetMyJoinedEventsImpl } from "../impl/get-my-joined-events.impl";
import { Inject } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@QueryHandler(GetMyJoinedEventsImpl)
export class GetMyJoinedEventsHandler implements IQueryHandler<GetMyJoinedEventsImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(query: GetMyJoinedEventsImpl): Promise<Events[]> {
    return this.repo.findEventsByParticipant(query.userId)
  }
}
