export class MarkNotificationReadImpl {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}
