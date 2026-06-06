export class UpdateUserStatusImpl {
  constructor(
    public readonly userId: string,
    public readonly status: string,
  ) {}
}
