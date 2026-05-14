export class Message {
  constructor(
    public readonly id: string,
    public readonly conversation_id: string,
    public readonly sender_id: string,
    public readonly content: string,
    public readonly is_read: boolean,
    public readonly is_deleted: boolean,
    public readonly sent_at: Date,
  ) {}
}
