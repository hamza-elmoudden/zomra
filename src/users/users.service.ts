import { Injectable, Inject } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ID_USER_REPOSITORY, UserRepository } from './domain/repositories/user.repository';
import { User } from './domain/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        @Inject(ID_USER_REPOSITORY)
        private readonly userRepo: UserRepository,
        private readonly prisma: PrismaService,
    ) {}

    // ─── Find user by ID ───────────────────────────────────────────
    async findOneId(id: string): Promise<User | null> {
        return this.userRepo.findById(id);
    }

    // ─── Find user by email ────────────────────────────────────────
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findByEmail(email);
    }

    // ─── findOrCreate on Google OAuth ─────────────────────────────
    async findOrCreateGoogleUser(params: {
        googleId: string;
        email: string;
        fullName: string;
    }): Promise<{ user: User; isNew: boolean }> {
        // Check by google_id first
        const existing = await this.prisma.users.findFirst({
            where: { google_id: params.googleId },
        });

        if (existing) {
            return {
                user: this.mapToUser(existing),
                isNew: false,
            };
        }

        // Check by email
        const byEmail = await this.prisma.users.findUnique({
            where: { email: params.email },
        });

        if (byEmail) {
            // Link google_id to existing account
            const updated = await this.prisma.users.update({
                where: { id: byEmail.id },
                data: { google_id: params.googleId },
            });
            return { user: this.mapToUser(updated), isNew: false };
        }

        // Create new user
        const username = params.email.split('@')[0] + '_' + Date.now();
        const created = await this.prisma.users.create({
            data: {
                email: params.email,
                google_id: params.googleId,
                full_name: params.fullName,
                username,
                is_active: false, // needs profile completion
            },
        });

        return { user: this.mapToUser(created), isNew: true };
    }

    // ─── Refresh token management ──────────────────────────────────
    async saveRefreshToken(userId: string, hashedToken: string): Promise<void> {
        await this.prisma.users.update({
            where: { id: userId },
            data: { refresh_token: hashedToken },
        });
    }

    async clearRefreshToken(userId: string): Promise<void> {
        await this.prisma.users.update({
            where: { id: userId },
            data: { refresh_token: null },
        });
    }

    // ─── Last login ────────────────────────────────────────────────
    async updateLastLogin(userId: string): Promise<void> {
        await this.prisma.users.update({
            where: { id: userId },
            data: { last_login: new Date() },
        }).catch(() => {
            // last_login field may not exist in older schema — ignore
        });
    }

    // ─── Map Prisma row → domain User ─────────────────────────────
    private mapToUser(data: any): User {
        return new User(
            data.id,
            data.username,
            data.email,
            data.google_id ?? undefined,
            data.phone ?? undefined,
            data.password_hash ?? undefined,
            data.full_name ?? undefined,
            data.bio ?? undefined,
            data.avatar_url ?? undefined,
            data.location,
            data.country ?? undefined,
            data.city ?? undefined,
            data.reputation_score ?? 5.0,
            data.total_reviews ?? 0,
            data.is_verified ?? false,
            data.is_active ?? true,
            data.created_at ?? new Date(),
            data.role ?? 'user',
            data.refresh_token ?? undefined,
        );
    }
}
