import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetGroupMessagesImpl } from "../impl/get-group-messages.impl";
import { Inject } from "@nestjs/common";
import { ID_GROUP_MESSAGE_REPOSITORY, GroupMessageRepository } from "src/messaging/domain/repositories/group-message.repository";
import { GroupMessage } from "src/messaging/domain/entities/group-message.entity";

@QueryHandler(GetGroupMessagesImpl)
export class GetGroupMessagesHandler implements IQueryHandler<GetGroupMessagesImpl> {

  constructor(
    @Inject(ID_GROUP_MESSAGE_REPOSITORY)
    private readonly repo: GroupMessageRepository,
  ) {}

  async execute(query: GetGroupMessagesImpl): Promise<GroupMessage[]> {
    return this.repo.findByEventId(query.eventId)
  }
}
