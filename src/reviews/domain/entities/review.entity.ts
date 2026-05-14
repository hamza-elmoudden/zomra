export class Review {
  constructor(
    public readonly id: string,
    public readonly reviewer_id: string,
    public readonly reviewed_user_id: string,
    public readonly event_id: string,
    public readonly rating: number,
    public readonly comment?: string,
    public readonly created_at?: Date,
  ) {}
}
