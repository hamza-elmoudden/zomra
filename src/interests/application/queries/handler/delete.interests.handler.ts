import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { DeleteInterestsImpl } from "../impl/delete.interests.impl";
import { Inject } from "@nestjs/common";
import { INTEREST_KAY } from "src/interests/domain/entities/interests.entities";
import { InterestsRepositories } from "src/interests/domain/repositories/interests.repositories";



@QueryHandler(DeleteInterestsImpl)
export class DeleteInterestsHandler implements IQueryHandler<DeleteInterestsImpl>{

    constructor(
        @Inject(INTEREST_KAY)
        private readonly repo:InterestsRepositories
    ){}


    async execute(query: DeleteInterestsImpl): Promise<any> {
        return await this.repo.delete(query.id)
    }

}