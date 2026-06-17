export class CreateConversationImpl {
  constructor(
    public readonly userId: string,
    public readonly recipientId: string,
    public readonly eventId?: string,
  ) {}
}
