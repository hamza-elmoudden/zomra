import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CompleteUserImpl } from "../impl/complete-user.impl";
import { ID_USER_REPOSITORY, UserRepository } from "src/users/domain/repositories/user.repository";
import { BadRequestException, Inject } from "@nestjs/common";
import { User } from "src/users/domain/entities/user.entity";



@CommandHandler(CompleteUserImpl)
export class CompleteUserHandler implements ICommandHandler<CompleteUserImpl> {
    constructor(
        @Inject(ID_USER_REPOSITORY)
        private readonly repo: UserRepository
    ) { }

    async execute(command: CompleteUserImpl): Promise<any> {
        let user: User | null | boolean

        user = await this.repo.findById(command.id)

        if (!user) {
            throw new BadRequestException("Account User Not Found")
        }

        if(user.is_active === true){
            throw new BadRequestException("User is Complete Login")
        }

        const data = new User(
           command.id,
           user.username,
           user.email,
           user.google_id,
           user.phone,
           user.password_hash,
           command.full_name,
           command.bio,
           user.avatar_url,
           command.lat,
           command.lng,
           command.country,
           command.city,
           user.reputation_score,
           user.total_reviews,
           user.is_verified,
           user.is_active,
           user.created_at,
           user.role,
           user.refresh_token
        )

        try {
            user = await this.repo.complete(data)

            return user
        } catch (error) {
            console.error("Error In Complete login User : ", error)
            throw new Error("Error In Complete Login User")
        }
    }
}