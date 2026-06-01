import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Inject,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import sharp from "sharp";
import { UploadMediaImpl } from "../impl/upload-media.impl";
import {
  ID_MEDIA_REPOSITORY,
  MediaRepository,
} from "../../../domain/repositories/media.repository";
import { Media } from "../../../domain/entities/media.entity";
import { StorageService } from "../../../infrastructure/storage.service";
import {
  EVENTS_KAY,
  EventsRepositories,
} from "src/events/domain/repositories/events.repositories";
import {
  EVENT_PARTICIPANT_KEY,
  EventParticipantRepository,
} from "src/events/domain/repositories/event-participant.repository";

@CommandHandler(UploadMediaImpl)
export class UploadMediaHandler implements ICommandHandler<UploadMediaImpl> {
  constructor(
    @Inject(ID_MEDIA_REPOSITORY)
    private readonly mediaRepo: MediaRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
    private readonly storage: StorageService,
  ) {}

  async execute(command: UploadMediaImpl): Promise<Media> {
    const { eventId, uploaderId, filename, buffer, mimetype, mediaType } =
      command;

    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const isHost = event.host_id === uploaderId;
    if (!isHost) {
      const participant = await this.participantRepo.findByEventAndUser(
        eventId,
        uploaderId,
      );
      if (!participant || participant.status !== "accepted") {
        throw new ForbiddenException(
          "Only accepted participants can upload media to this event",
        );
      }
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];
    if (!allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV",
      );
    }

    if (buffer.length > 50 * 1024 * 1024) {
      throw new BadRequestException("File exceeds maximum size of 50MB");
    }

    const id = crypto.randomUUID();
    const ext = filename.split(".").pop() || "jpg";
    const key = `media/${eventId}/${id}.${ext}`;
    const thumbnailKey = `media/${eventId}/thumb_${id}.jpg`;

    try {
      const url = await this.storage.uploadFile(buffer, key, mimetype);

      let thumbnailUrl: string | null = null;
      if (mimetype.startsWith("image/") && mimetype !== "image/gif") {
        const thumbnailBuffer = await sharp(buffer)
          .resize(300, 300, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();
        thumbnailUrl = await this.storage.uploadFile(
          thumbnailBuffer,
          thumbnailKey,
          "image/jpeg",
        );
      }

      const media = new Media(
        id,
        eventId,
        uploaderId,
        mediaType,
        url,
        thumbnailUrl,
        null,
        0,
        0,
        new Date(),
      );

      return await this.mediaRepo.create(media);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException("Failed to upload media");
    }
  }
}
