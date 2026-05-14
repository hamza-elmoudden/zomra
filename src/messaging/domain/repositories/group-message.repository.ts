import { GroupMessage } from "../entities/group-message.entity";

export const ID_GROUP_MESSAGE_REPOSITORY = "ID_GROUP_MESSAGE_REPOSITORY";

export abstract class GroupMessageRepository {
  abstract create(data: GroupMessage): Promise<GroupMessage>
  abstract findByEventId(eventId: string): Promise<GroupMessage[]>
  abstract findById(id: string): Promise<GroupMessage | null>
  abstract softDelete(id: string): Promise<void>
}
