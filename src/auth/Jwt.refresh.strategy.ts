// src/auth/Jwt.refresh.strategy.ts

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    // 1. Extract raw token from cookie or Authorization header
    const raw =
      req.cookies?.refresh_token ??
      req.get('Authorization')?.replace('Bearer ', '').trim();

    if (!raw) throw new UnauthorizedException('No refresh token provided');

    // 2. Load user from DB
    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('Refresh token revoked or not found');
    }

    // 3. Hash incoming token and compare with stored hash
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    if (hashed !== user.refresh_token) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return user; // → req.user
  }
}
