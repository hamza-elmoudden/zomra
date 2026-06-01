import { IsOptional, IsEnum } from "class-validator";
import { media_type } from "generated/prisma/enums";

export class UploadMediaDto {
  @IsOptional()
  @IsEnum(media_type, {
    message: `mediaType must be one of: ${Object.values(media_type).join(", ")}`,
  })
  mediaType?: media_type;
}
