import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetEventParticipantsImpl } from "../impl/get-event-participants.impl";
import { Inject } from "@nestjs/common";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";

@QueryHandler(GetEventParticipantsImpl)
export class GetEventParticipantsHandler implements IQueryHandler<GetEventParticipantsImpl> {

  constructor(
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly repo: EventParticipantRepository,
  ) {}

  async execute(query: GetEventParticipantsImpl): Promise<EventParticipant[]> {
    return this.repo.findByEventId(query.eventId)
  }
}
