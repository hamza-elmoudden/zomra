import { participant_status } from "generated/prisma/enums";

export class EventParticipant {
  constructor(
    public readonly id: string,
    public readonly event_id: string,
    public readonly user_id: string,
    public readonly status: participant_status,
    public readonly joined_at: Date,
  ) {}
}
