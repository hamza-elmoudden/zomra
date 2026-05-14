export class CreateReviewImpl {
  constructor(
    public readonly reviewerId: string,
    public readonly reviewedUserId: string,
    public readonly eventId: string,
    public readonly rating: number,
    public readonly comment?: string,
  ) {}
}
