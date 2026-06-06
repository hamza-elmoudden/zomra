import { IsEnum } from 'class-validator';

export enum UserStatus {
  Active = 'active',
  Blocked = 'blocked',
  Banned = 'banned',
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
