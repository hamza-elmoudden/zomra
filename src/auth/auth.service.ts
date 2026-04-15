// src/auth/auth.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from 'src/users/domain/entities/user.entity';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { JwtPayload } from './Jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds — front-end uses for auto-refresh timer
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  // ─── Google login ────────────────────────────────────────────
  async googleLogin(user: User): Promise<TokenPair> {
    await this.userRepo.updateLastLogin(user.id);
    return this.generateTokens(user);
  }

  // ─── Token rotation ──────────────────────────────────────────
  async rotateTokens(user: User): Promise<TokenPair> {
    await this.userRepo.clearRefreshToken(user.id);
    return this.generateTokens(user);
  }

  // ─── Logout ──────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.userRepo.clearRefreshToken(userId);
  }

  // ─── Generate tokens (internal) ─────────────────────────────
  async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = 60 * 15; // 15 min in seconds

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    // Hash before storing — NEVER store plain refresh token
    const hashed = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.userRepo.saveRefreshToken(user.id, hashed);

    return { accessToken, refreshToken, expiresIn };
  }
}
