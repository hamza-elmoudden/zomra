import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetGroupMessagesImpl } from "../impl/get-group-messages.impl";
import { Inject, NotFoundException, ForbiddenException } from "@nestjs/common";
import { ID_GROUP_MESSAGE_REPOSITORY, GroupMessageRepository } from "src/messaging/domain/repositories/group-message.repository";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { GroupMessage } from "src/messaging/domain/entities/group-message.entity";

@QueryHandler(GetGroupMessagesImpl)
export class GetGroupMessagesHandler implements IQueryHandler<GetGroupMessagesImpl> {

  constructor(
    @Inject(ID_GROUP_MESSAGE_REPOSITORY)
    private readonly groupMsgRepo: GroupMessageRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
  ) {}

  async execute(query: GetGroupMessagesImpl): Promise<GroupMessage[]> {
    const event = await this.eventRepo.findById(query.eventId)
    if (!event) {
      throw new NotFoundException("Event not found")
    }

    if (event.host_id !== query.userId) {
      const participant = await this.participantRepo.findByEventAndUser(query.eventId, query.userId)
      if (!participant || participant.status !== "accepted") {
        throw new ForbiddenException("You must be an accepted participant to view group messages")
      }
    }

    return this.groupMsgRepo.findByEventId(query.eventId)
  }
}
