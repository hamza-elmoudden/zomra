import { event_status } from "generated/prisma/enums";

export class Events {
  constructor(
    public readonly id: string,
    public readonly host_id: string,
    public readonly title: string,
    public readonly category: string,
    public readonly starts_at: Date,

    public readonly duration_minutes: number,
    public readonly max_participants: number,
    public readonly current_count: number,

    public readonly status: event_status,
    public readonly is_public: boolean,

    public readonly description?: string,
    public readonly address?: string,
    public readonly city?: string,

    public readonly cover_image_url?: string,

    public readonly created_at?: Date,
    public readonly updated_at?: Date,

    public readonly lat?: number,
    public readonly lng?: number
  ) {}
}