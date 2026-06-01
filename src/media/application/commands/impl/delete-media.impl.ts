export class DeleteMediaImpl {
  constructor(
    public readonly mediaId: string,
    public readonly userId: string,
  ) {}
}
