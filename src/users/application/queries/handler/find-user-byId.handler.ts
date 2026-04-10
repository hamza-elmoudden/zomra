import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { findUserById } from "../impl/find-user-byId.impl";
import { ID_USER_REPOSITORY, UserRepository } from "src/users/domain/repositories/user.repository";
import { Inject, NotFoundException } from "@nestjs/common";
import { User } from "src/users/domain/entities/user.entity";


@QueryHandler(findUserById)
export class findUserByIdHandler implements IQueryHandler<findUserById>{

    constructor(
        @Inject(ID_USER_REPOSITORY)
        private readonly repo : UserRepository
    ){}


    async execute(query: findUserById): Promise<User | null> {
        try {

            const user = await this.repo.findById(query.id)

            if(!user){
                throw new NotFoundException("User Not Found")
            }

            return user

        } catch (error) {
            console.error('Error In Find User',error)
            throw new Error("Error In Find User")
        }
    }
}