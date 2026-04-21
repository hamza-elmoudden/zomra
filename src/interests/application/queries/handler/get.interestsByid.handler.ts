import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetInterestByIdImpl } from "../impl/get.interestsByid.impl";
import { InterestsRepositories } from "src/interests/domain/repositories/interests.repositories";
import { Inject } from "@nestjs/common";
import { INTEREST_KAY } from "src/interests/domain/entities/interests.entities";




@QueryHandler(GetInterestByIdImpl)
export class GetInterestsByIdHandler implements IQueryHandler<GetInterestByIdImpl>{

    constructor(
        @Inject(INTEREST_KAY)
        private readonly repo:InterestsRepositories
    ){}
    async execute(query: GetInterestByIdImpl): Promise<any> {
        const intre = await this.repo.getById(query.id)

        return intre
    }

}