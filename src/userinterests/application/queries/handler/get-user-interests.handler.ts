import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetUserInterestsImpl } from "../impl/get-user-interests.impl";
import { Inject } from "@nestjs/common";
import { UserInterestsRepositories } from "src/userinterests/domain/repositories/userinterests.repositories";
import { USER_INTERESTS } from "src/userinterests/domain/entities/user.entities";
import { UserInterests } from "src/userinterests/domain/entities/user.entities";

@QueryHandler(GetUserInterestsImpl)
export class GetUserInterestsHandler implements IQueryHandler<GetUserInterestsImpl> {

  constructor(
    @Inject(USER_INTERESTS)
    private readonly repo: UserInterestsRepositories,
  ) {}

  async execute(query: GetUserInterestsImpl): Promise<UserInterests[]> {
    return this.repo.getAllUserInterests(query.userId)
  }
}
