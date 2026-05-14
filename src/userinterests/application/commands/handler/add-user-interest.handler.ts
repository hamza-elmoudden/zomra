import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AddUserInterestImpl } from "../impl/add-user-interest.impl";
import { Inject, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { UserInterestsRepositories } from "src/userinterests/domain/repositories/userinterests.repositories";
import { USER_INTERESTS } from "src/userinterests/domain/entities/user.entities";
import { UserInterests } from "src/userinterests/domain/entities/user.entities";

@CommandHandler(AddUserInterestImpl)
export class AddUserInterestHandler implements ICommandHandler<AddUserInterestImpl> {

  constructor(
    @Inject(USER_INTERESTS)
    private readonly repo: UserInterestsRepositories,
  ) {}

  async execute(command: AddUserInterestImpl): Promise<UserInterests> {
    const existing = await this.repo.getOneUserInterest(command.userId, command.interestId)

    if (existing) {
      throw new ConflictException('Interest already added to user')
    }

    try {
      return await this.repo.createUserInterest(command.userId, command.interestId)
    } catch (error) {
      if (error instanceof ConflictException) throw error
      throw new InternalServerErrorException('Failed to add interest')
    }
  }
}
