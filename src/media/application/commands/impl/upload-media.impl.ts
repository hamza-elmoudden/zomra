import { media_type } from "generated/prisma/enums";

export class UploadMediaImpl {
  constructor(
    public readonly eventId: string,
    public readonly uploaderId: string,
    public readonly filename: string,
    public readonly buffer: Buffer,
    public readonly mimetype: string,
    public readonly mediaType: media_type,
  ) {}
}
