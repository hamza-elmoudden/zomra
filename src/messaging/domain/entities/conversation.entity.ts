export class Conversation {
  constructor(
    public readonly id: string,
    public readonly user_1_id: string,
    public readonly user_2_id: string,
    public readonly event_id?: string,
    public readonly created_at?: Date,
    public readonly last_message_at?: Date,
  ) {}
}
