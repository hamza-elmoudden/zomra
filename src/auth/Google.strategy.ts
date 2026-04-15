// src/auth/Google.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {
    super({
      clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const { id, emails, displayName, photos } = profile;

      const { user } = await this.userRepo.findOrCreateGoogleUser({
        googleId: id,
        email: emails[0].value,
        fullName: displayName,
        avatarUrl: photos?.[0]?.value,
      });

      done(null, user);
    } catch (error) {
      done(error, undefined);
    }
  }
}
