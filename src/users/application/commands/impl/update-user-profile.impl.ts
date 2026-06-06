export class UpdateUserProfileImpl {
  constructor(
    public readonly userId: string,
    public readonly phone?: string,
    public readonly full_name?: string,
    public readonly bio?: string,
    public readonly avatar_url?: string,
    public readonly lat?: number,
    public readonly lng?: number,
    public readonly country?: string,
    public readonly city?: string,
  ) {}
}
