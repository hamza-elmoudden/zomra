import { Controller, Get, Req } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { findUserByIdImpl } from "../application/queries/impl/find-user-byId.impl";
import { User } from "../domain/entities/user.entity";




@Controller('Users')
export class UsersController{
    constructor(
        private readonly commandBus:CommandBus,
        private readonly queryBus:QueryBus
    ){}


    @Get('me')
    async findUserById(@Req() req:any):Promise<User>{


        const user = await this.queryBus.execute(new findUserByIdImpl(req.user.id))

        

        return user
    }
}