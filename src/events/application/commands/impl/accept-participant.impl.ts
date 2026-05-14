export class AcceptParticipantImpl {
  constructor(
    public readonly eventId: string,
    public readonly userId: string,
    public readonly hostId: string,
  ) {}
}
