import { Controller, Get, Param, Patch, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
import { StorageService } from "src/media/infrastructure/storage.service";
import { toSafeUser } from "./user-response.mapper";

@Controller('users')
export class UsersController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly storageService: StorageService,
    ) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async findCurrentUser(@CurrentUser() user: User) {
        const result = await this.queryBus.execute(new findUserByIdImpl(user.id));
        return toSafeUser(result);
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

    @Post('me/avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ avatar_url: string }> {
        if (!file) {
            throw new BadRequestException('No file uploaded')
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only JPEG, PNG, GIF, and WebP images are allowed')
        }

        const key = `avatars/${user.id}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
        const url = await this.storageService.uploadFile(file.buffer, key, file.mimetype)

        await this.commandBus.execute(
            new UpdateUserProfileImpl(user.id, undefined, undefined, undefined, url),
        )

        return { avatar_url: url }
    }

    @Get('email/:email')
    @UseGuards(JwtAuthGuard)
    async findUserByEmail(@Param('email') email: string) {
        const result = await this.queryBus.execute(new FindUserByEmailImpl(email));
        return toSafeUser(result);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findUserById(@Param('id') id: string) {
        const result = await this.queryBus.execute(new findUserByIdImpl(id));
        return toSafeUser(result);
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