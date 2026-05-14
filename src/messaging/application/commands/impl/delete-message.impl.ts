export class DeleteMessageImpl {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
  ) {}
}
