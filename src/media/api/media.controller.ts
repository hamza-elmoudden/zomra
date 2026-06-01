import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { media_type } from "generated/prisma/enums";
import { Media } from "../domain/entities/media.entity";
import { UploadMediaDto } from "./dto/upload-media.dto";
import { UploadMediaImpl } from "../application/commands/impl/upload-media.impl";
import { DeleteMediaImpl } from "../application/commands/impl/delete-media.impl";
import { GetEventMediaImpl } from "../application/queries/impl/get-event-media.impl";

@Controller()
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post("events/:eventId/media")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @Param("eventId", ParseUUIDPipe) eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: User,
  ): Promise<Media> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const mediaType: media_type = dto.mediaType ?? media_type.photo;

    return this.commandBus.execute(
      new UploadMediaImpl(
        eventId,
        user.id,
        file.originalname,
        file.buffer,
        file.mimetype,
        mediaType,
      ),
    );
  }

  @Get("events/:eventId/media")
  async getEventMedia(
    @Param("eventId", ParseUUIDPipe) eventId: string,
  ): Promise<Media[]> {
    return this.queryBus.execute(new GetEventMediaImpl(eventId));
  }

  @Delete("media/:id")
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteMediaImpl(id, user.id));
  }
}
