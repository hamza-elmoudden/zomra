import { Media } from "../entities/media.entity";

export const ID_MEDIA_REPOSITORY = "ID_MEDIA_REPOSITORY";

export abstract class MediaRepository {
  abstract create(data: Media): Promise<Media>;
  abstract findByEventId(eventId: string): Promise<Media[]>;
  abstract findById(id: string): Promise<Media | null>;
  abstract delete(id: string): Promise<void>;
}
