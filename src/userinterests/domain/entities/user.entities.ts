export const USER_INTERESTS = "USER_INTERESTS"

export class UserInterests {
  constructor(
    public readonly user_id: string,
    public readonly interest_id: number,
    public readonly created_at?: Date,
  ) {}
}
