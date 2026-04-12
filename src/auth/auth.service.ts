// src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/domain/entities/user.entity';
import { JwtPayload } from './Jwt.strategy';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;   // seconds — front-end uses for auto-refresh timer
}

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly config: ConfigService,
    ) { }

    // ─────────────────────────────────────────────────────────────
    //  GOOGLE LOGIN
    //  Called after GoogleStrategy.validate() puts user in req.user
    // ─────────────────────────────────────────────────────────────
    async googleLogin(user: User): Promise<TokenPair> {
        await this.usersService.updateLastLogin(user.id);
        return this.generateTokens(user);
    }

    // ─────────────────────────────────────────────────────────────
    //  REFRESH — token rotation
    //  Called after JwtRefreshStrategy already validated the token
    //  1. Clears old hash immediately (rotation — stolen token useless)
    //  2. Issues fresh access + refresh pair
    // ─────────────────────────────────────────────────────────────
    async rotateTokens(user: User): Promise<TokenPair> {
        await this.usersService.clearRefreshToken(user.id);
        return this.generateTokens(user);
    }

    // ─────────────────────────────────────────────────────────────
    //  LOGOUT
    //  Clears hashed refresh token — next /refresh call returns 401
    // ─────────────────────────────────────────────────────────────
    async logout(userId: string): Promise<void> {
        await this.usersService.clearRefreshToken(userId);
    }

    // ─────────────────────────────────────────────────────────────
    //  GENERATE TOKENS  (internal)
    // ─────────────────────────────────────────────────────────────
    async generateTokens(user: User): Promise<TokenPair> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const expiresIn = 60 * 15; // 15 min in seconds

        // ── Short-lived access token ──────────────────────────────
        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn,
        });

        // ── Long-lived refresh token ──────────────────────────────
        const refreshToken = this.jwtService.sign(
            { sub: user.id },
            {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
            },
        );    // ── Hash before storing — NEVER store plain refresh token ─
        const hashed = crypto
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');

        await this.usersService.saveRefreshToken(user.id, hashed);

        return { accessToken, refreshToken, expiresIn };
    }
}