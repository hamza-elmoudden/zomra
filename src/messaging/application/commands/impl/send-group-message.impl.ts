export class SendGroupMessageImpl {
  constructor(
    public readonly senderId: string,
    public readonly eventId: string,
    public readonly content: string,
  ) {}
}
