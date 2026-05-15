import { IsEnum } from 'class-validator';
import { event_status } from 'generated/prisma/enums';

export class SuspendEventDto {
  @IsEnum(event_status)
  status: event_status;
}
