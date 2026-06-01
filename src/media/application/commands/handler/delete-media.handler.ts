import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Inject,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { DeleteMediaImpl } from "../impl/delete-media.impl";
import {
  ID_MEDIA_REPOSITORY,
  MediaRepository,
} from "../../../domain/repositories/media.repository";
import { StorageService } from "../../../infrastructure/storage.service";
import {
  EVENTS_KAY,
  EventsRepositories,
} from "src/events/domain/repositories/events.repositories";

@CommandHandler(DeleteMediaImpl)
export class DeleteMediaHandler implements ICommandHandler<DeleteMediaImpl> {
  private readonly logger = new Logger(DeleteMediaHandler.name);

  constructor(
    @Inject(ID_MEDIA_REPOSITORY)
    private readonly mediaRepo: MediaRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    private readonly storage: StorageService,
  ) {}

  async execute(command: DeleteMediaImpl): Promise<void> {
    const media = await this.mediaRepo.findById(command.mediaId);
    if (!media) {
      throw new NotFoundException("Media not found");
    }

    const isUploader = media.uploader_id === command.userId;
    if (!isUploader) {
      const event = await this.eventRepo.findById(media.event_id);
      const isHost = event?.host_id === command.userId;
      if (!isHost) {
        throw new ForbiddenException(
          "Only the uploader or the event host can delete this media",
        );
      }
    }

    try {
      const key = this.storage.extractKeyFromUrl(media.url);
      await this.storage.deleteFile(key);
    } catch {
      this.logger.warn(
        `S3 delete failed for media ${command.mediaId} — continuing with DB delete`,
      );
    }

    if (media.thumbnail_url) {
      try {
        const thumbKey = this.storage.extractKeyFromUrl(media.thumbnail_url);
        await this.storage.deleteFile(thumbKey);
      } catch {
        this.logger.warn(
          `S3 thumbnail delete failed for media ${command.mediaId} — continuing`,
        );
      }
    }

    try {
      await this.mediaRepo.delete(command.mediaId);
    } catch {
      throw new InternalServerErrorException("Failed to delete media");
    }
  }
}
