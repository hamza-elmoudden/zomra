import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetAllInterestsImpl } from "../impl/getall.interests.impl";
import { Inject } from "@nestjs/common";
import { INTEREST_KAY } from "src/interests/domain/entities/interests.entities";
import { InterestsRepositories } from "src/interests/domain/repositories/interests.repositories";



@QueryHandler(GetAllInterestsImpl)
export class GetAllInterestsHandler implements IQueryHandler<GetAllInterestsImpl> {
    constructor(
        @Inject(INTEREST_KAY)
        private readonly repo: InterestsRepositories
    ) { }

    async execute(query: GetAllInterestsImpl): Promise<any> {
        const intre = await this.repo.getAllInterests()

        return intre
    }
}