import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { findUserByIdImpl } from "../impl/find-user-byId.impl";
import { ID_USER_REPOSITORY, UserRepository } from "src/users/domain/repositories/user.repository";
import { Inject, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { User } from "src/users/domain/entities/user.entity";


@QueryHandler(findUserByIdImpl)
export class findUserByIdHandler implements IQueryHandler<findUserByIdImpl>{

    constructor(
        @Inject(ID_USER_REPOSITORY)
        private readonly repo : UserRepository
    ){}


    async execute(query: findUserByIdImpl): Promise<User> {
        try {

            const user = await this.repo.findById(query.id)

            if(!user){
                throw new NotFoundException("User Not Found")
            }

            return user

        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}