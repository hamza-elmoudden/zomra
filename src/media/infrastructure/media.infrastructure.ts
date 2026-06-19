import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Media } from "../domain/entities/media.entity";
import { MediaRepository } from "../domain/repositories/media.repository";

@Injectable()
export class MediaInfrastructure implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SELECT = {
    id: true, event_id: true, uploader_id: true, media_type: true,
    url: true, thumbnail_url: true, duration_seconds: true,
    views_count: true, likes_count: true, created_at: true,
  } as const;

  private mapToMedia(data: any): Media {
    return new Media(
      data.id,
      data.event_id,
      data.uploader_id,
      data.media_type,
      data.url,
      data.thumbnail_url,
      data.duration_seconds,
      data.views_count,
      data.likes_count,
      data.created_at,
    );
  }

  async create(data: Media): Promise<Media> {
    try {
      const result = await this.prisma.media.create({
        data: {
          id: data.id,
          event_id: data.event_id,
          uploader_id: data.uploader_id,
          media_type: data.media_type,
          url: data.url,
          thumbnail_url: data.thumbnail_url,
          duration_seconds: data.duration_seconds,
        },
      });
      return this.mapToMedia(result);
    } catch (error) {
      throw new InternalServerErrorException("Failed to create media");
    }
  }

  async findByEventId(eventId: string): Promise<Media[]> {
    try {
      const data = await this.prisma.media.findMany({
        where: { event_id: eventId },
        select: this.SELECT,
        orderBy: { created_at: "desc" },
      });
      return data.map((m) => this.mapToMedia(m));
    } catch (error) {
      throw new InternalServerErrorException("Failed to find media");
    }
  }

  async findById(id: string): Promise<Media | null> {
    try {
      const data = await this.prisma.media.findUnique({
        where: { id },
        select: this.SELECT,
      });
      return data ? this.mapToMedia(data) : null;
    } catch (error) {
      throw new InternalServerErrorException("Failed to find media");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.media.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete media");
    }
  }
}
