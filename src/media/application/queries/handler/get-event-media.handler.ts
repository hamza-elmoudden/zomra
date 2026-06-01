import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetEventMediaImpl } from "../impl/get-event-media.impl";
import {
  ID_MEDIA_REPOSITORY,
  MediaRepository,
} from "../../../domain/repositories/media.repository";
import { Media } from "../../../domain/entities/media.entity";

@QueryHandler(GetEventMediaImpl)
export class GetEventMediaHandler implements IQueryHandler<GetEventMediaImpl> {
  constructor(
    @Inject(ID_MEDIA_REPOSITORY)
    private readonly mediaRepo: MediaRepository,
  ) {}

  async execute(query: GetEventMediaImpl): Promise<Media[]> {
    return this.mediaRepo.findByEventId(query.eventId);
  }
}
