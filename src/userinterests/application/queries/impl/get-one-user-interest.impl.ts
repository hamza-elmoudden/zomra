export class GetOneUserInterestImpl {
  constructor(
    public readonly userId: string,
    public readonly interestId: number,
  ) {}
}
