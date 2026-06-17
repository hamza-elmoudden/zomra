export class GetMessagesImpl {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
  ) {}
}
