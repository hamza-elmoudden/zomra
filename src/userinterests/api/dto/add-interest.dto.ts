import { IsNumber } from 'class-validator';

export class AddInterestDto {
  @IsNumber()
  interestId: number;
}
