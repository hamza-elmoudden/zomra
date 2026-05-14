export class RejectParticipantImpl {
  constructor(
    public readonly eventId: string,
    public readonly userId: string,
    public readonly hostId: string,
  ) {}
}
