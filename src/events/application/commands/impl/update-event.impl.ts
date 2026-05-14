import { event_status } from "generated/prisma/enums";

export class UpdateEventImpl {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly starts_at?: Date,
    public readonly duration_minutes?: number,
    public readonly max_participants?: number,
    public readonly address?: string,
    public readonly city?: string,
    public readonly cover_image_url?: string,
    public readonly lat?: number,
    public readonly lng?: number,
    public readonly status?: event_status,
  ) {}
}
