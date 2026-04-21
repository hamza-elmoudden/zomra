import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateInterestsImpl } from "../impl/create.interests.impl";
import { InterestsRepositories } from "src/interests/domain/repositories/interests.repositories";
import { Inject } from "@nestjs/common";
import { INTEREST_KAY, Interests } from "src/interests/domain/entities/interests.entities";



@CommandHandler(CreateInterestsImpl)
export class CreateInterestsHandler implements ICommandHandler<CreateInterestsImpl>{

    constructor(
        @Inject(INTEREST_KAY)
        private readonly repo:InterestsRepositories
    ){}

    async execute(command: CreateInterestsImpl): Promise<any> {
        const data = new Interests(
            1,
            command.name,
            command.icon,
            command.color_hex
        )

        const intre = await this.repo.create(data)


        return intre
    }

}