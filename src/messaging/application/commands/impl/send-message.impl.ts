export class SendMessageImpl {
  constructor(
    public readonly senderId: string,
    public readonly conversationId: string,
    public readonly content: string,
  ) {}
}
