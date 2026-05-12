import { EventParticipant } from "../entities/event-participant.entity";
import { participant_status } from "generated/prisma/enums";

export const EVENT_PARTICIPANT_KEY = "EVENT_PARTICIPANT_KEY"

export abstract class EventParticipantRepository {
    abstract create(data: EventParticipant): Promise<EventParticipant>
    abstract delete(id: string): Promise<void>
    abstract findById(id: string): Promise<EventParticipant | null>
    abstract findByEventId(eventId: string): Promise<EventParticipant[]>
    abstract findByEventAndUser(eventId: string, userId: string): Promise<EventParticipant | null>
    abstract updateStatus(id: string, status: participant_status): Promise<EventParticipant>
    abstract countByEventId(eventId: string): Promise<number>
}
