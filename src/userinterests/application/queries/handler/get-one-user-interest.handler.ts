import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetOneUserInterestImpl } from "../impl/get-one-user-interest.impl";
import { Inject, NotFoundException } from "@nestjs/common";
import { UserInterestsRepositories } from "src/userinterests/domain/repositories/userinterests.repositories";
import { USER_INTERESTS } from "src/userinterests/domain/entities/user.entities";
import { UserInterests } from "src/userinterests/domain/entities/user.entities";

@QueryHandler(GetOneUserInterestImpl)
export class GetOneUserInterestHandler implements IQueryHandler<GetOneUserInterestImpl> {

  constructor(
    @Inject(USER_INTERESTS)
    private readonly repo: UserInterestsRepositories,
  ) {}

  async execute(query: GetOneUserInterestImpl): Promise<UserInterests> {
    const result = await this.repo.getOneUserInterest(query.userId, query.interestId)

    if (!result) {
      throw new NotFoundException('Interest not found for user')
    }

    return result
  }
}
