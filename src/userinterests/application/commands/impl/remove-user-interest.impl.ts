export class RemoveUserInterestImpl {
  constructor(
    public readonly userId: string,
    public readonly interestId: number,
  ) {}
}
