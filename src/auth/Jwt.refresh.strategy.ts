// src/auth/strategies/jwt-refresh.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null, 
        ExtractJwt.fromAuthHeaderAsBearerToken(),                
      ]),
      secretOrKey: config.getOrThrow('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,   // need raw token to compare with DB hash
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    // 1. get raw token from Authorization header
    const raw =  req.cookies?.refresh_token || req.get('Authorization')?.replace('Bearer ', '').trim();
    if (!raw) throw new UnauthorizedException('No refresh token provided');

    // 2. load user from DB via Prisma
    const user = await this.usersService.findOneId(payload.sub);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException('Refresh token revoked or not found');
    }

    // 3. hash incoming token and compare with stored hash
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    if (hashed !== user.refresh_token) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return user;  // → req.user
  }
}