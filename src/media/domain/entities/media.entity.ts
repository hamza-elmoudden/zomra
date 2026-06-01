import { media_type } from "generated/prisma/enums";

export class Media {
  constructor(
    public readonly id: string,
    public readonly event_id: string,
    public readonly uploader_id: string,
    public readonly media_type: media_type,
    public readonly url: string,
    public readonly thumbnail_url: string | null,
    public readonly duration_seconds: number | null,
    public readonly views_count: number,
    public readonly likes_count: number,
    public readonly created_at: Date,
  ) {}
}
