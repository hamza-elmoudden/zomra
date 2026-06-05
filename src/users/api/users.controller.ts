import { Controller, Get, Param, Patch, Body, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { findUserByIdImpl } from "../application/queries/impl/find-user-byId.impl";
import { FindUserByEmailImpl } from "../application/queries/impl/find-user-by-email.impl";
import { UpdateUserStatusImpl } from "../application/commands/impl/update-user-status.impl";
import { UpdateUserProfileImpl } from "../application/commands/impl/update-user-profile.impl";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { User } from "../domain/entities/user.entity";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { AdminGuard } from "src/admin/guards/admin.guard";
import { CurrentUser } from "src/auth/decorators/decorators";


@Controller('users')
export class UsersController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async findCurrentUser(@CurrentUser() user: User): Promise<User> {
        return this.queryBus.execute(new findUserByIdImpl(user.id));
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    async updateProfile(
        @CurrentUser() user: User,
        @Body() dto: UpdateUserProfileDto,
    ): Promise<boolean> {
        return this.commandBus.execute(
            new UpdateUserProfileImpl(
                user.id,
                dto.phone,
                dto.full_name,
                dto.bio,
                dto.avatar_url,
                dto.lat,
                dto.lng,
                dto.country,
                dto.city,
            ),
        );
    }

    @Get('email/:email')
    @UseGuards(JwtAuthGuard)
    async findUserByEmail(@Param('email') email: string): Promise<User> {
        return this.queryBus.execute(new FindUserByEmailImpl(email));
    }

    @Get(':id')
    async findUserById(@Param('id') id: string): Promise<User> {
        return this.queryBus.execute(new findUserByIdImpl(id));
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateUserStatus(
        @Param('id') id: string,
        @Body() dto: UpdateUserStatusDto,
    ): Promise<User> {
        return this.commandBus.execute(new UpdateUserStatusImpl(id, dto.status));
    }
}