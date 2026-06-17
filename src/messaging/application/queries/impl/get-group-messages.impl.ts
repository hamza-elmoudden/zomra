export class GetGroupMessagesImpl {
  constructor(
    public readonly eventId: string,
    public readonly userId: string,
  ) {}
}
