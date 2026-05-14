import { IsUUID, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  recipientId: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;
}
