import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RemoveUserInterestImpl } from "../impl/remove-user-interest.impl";
import { Inject, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { UserInterestsRepositories } from "src/userinterests/domain/repositories/userinterests.repositories";
import { USER_INTERESTS } from "src/userinterests/domain/entities/user.entities";

@CommandHandler(RemoveUserInterestImpl)
export class RemoveUserInterestHandler implements ICommandHandler<RemoveUserInterestImpl> {

  constructor(
    @Inject(USER_INTERESTS)
    private readonly repo: UserInterestsRepositories,
  ) {}

  async execute(command: RemoveUserInterestImpl): Promise<void> {
    const existing = await this.repo.getOneUserInterest(command.userId, command.interestId)

    if (!existing) {
      throw new NotFoundException('Interest not found for user')
    }

    try {
      await this.repo.deleteUserInterest(command.userId, command.interestId)
    } catch (error) {
      throw new InternalServerErrorException('Failed to remove interest')
    }
  }
}
