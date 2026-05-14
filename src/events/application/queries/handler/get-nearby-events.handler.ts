import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetNearbyEventsImpl } from "../impl/get-nearby-events.impl";
import { Inject } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";

@QueryHandler(GetNearbyEventsImpl)
export class GetNearbyEventsHandler implements IQueryHandler<GetNearbyEventsImpl> {

  constructor(
    @Inject(EVENTS_KAY)
    private readonly repo: EventsRepositories,
  ) {}

  async execute(query: GetNearbyEventsImpl): Promise<Events[]> {
    return this.repo.findNearby(query.lat, query.lng, query.radiusKm)
  }
}
