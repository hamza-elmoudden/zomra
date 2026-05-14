import { event_status } from "generated/prisma/enums";

export class ListEventsImpl {
  constructor(
    public readonly city?: string,
    public readonly category?: string,
    public readonly status?: event_status,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
