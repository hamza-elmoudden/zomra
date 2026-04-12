import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { findUserByIdImpl } from "../application/queries/impl/find-user-byId.impl";
import { User } from "../domain/entities/user.entity";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";


@Controller('users')
export class UsersController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async findUserById(@CurrentUser() user: User): Promise<User> {
        return this.queryBus.execute(new findUserByIdImpl(user.id));
    }
}