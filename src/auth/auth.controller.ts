// src/auth/auth.controller.ts

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { User } from 'src/users/domain/entities/user.entity';
import { CurrentUser } from './decorators/decorators';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


/**
 *  Routes
 *  ─────────────────────────────────────────────────────────────
 *  GET  /auth/google             → redirect to Google consent
 *  GET  /auth/google/callback    → Google returns here → issue tokens
 *  POST /auth/refresh            → rotate (Bearer <refreshToken>)
 *  POST /auth/logout             → revoke refresh token
 *  GET  /auth/me                 → current user profile
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ─────────────────────────────────────────────────────────────
  //  GET /auth/google
  //  Passport redirects to Google consent screen — no body needed
  // ─────────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleRedirect() { }

  // ─────────────────────────────────────────────────────────────
  //  GET /auth/google/callback
  //  Google posts back here after user grants consent.
  //  GoogleStrategy.validate() runs → user in req.user
  // ─────────────────────────────────────────────────────────────
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const isMobile = req.query.platform === 'mobile'
    const tokens = await this.authService.googleLogin(req.user as User);

    const base = process.env.FRONTEND_URL;
    const isProd = process.env.NODE_ENV === 'production';


    if (!isMobile) {
      const redirectUrl = `${base}/auth/success?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
      return res.redirect(redirectUrl);

    } else {
      return res.redirect(
      `safa://auth/success?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`
    );
    
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  POST /auth/refresh
  //  Header: Authorization: Bearer <refreshToken>
  //
  //  Flow:
  //    JwtRefreshGuard → JwtRefreshStrategy:
  //      1. Verifies JWT signature (JWT_REFRESH_SECRET)
  //      2. Loads user from Prisma
  //      3. Hashes incoming token → compares with DB hash
  //      4. Sets req.user on success
  //    Controller: calls rotateTokens()
  //      - Deletes old hash immediately
  //      - Issues new access + refresh pair
  //
  //  ⚠️ Client must save BOTH new tokens — old refreshToken is dead
  // ─────────────────────────────────────────────────────────────
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {

    const tokens = await this.authService.rotateTokens(user);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return tokens;
    // returns: { accessToken, refreshToken, expiresIn }
  }

  // ─────────────────────────────────────────────────────────────
  //  POST /auth/logout
  //  Header: Authorization: Bearer <accessToken>
  //  Clears refresh token hash from DB via Prisma
  // ─────────────────────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  //  GET /auth/me
  //  Header: Authorization: Bearer <accessToken>
  //  Returns safe public profile — strips sensitive fields
  // ─────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    const {
      password_hash,
      refresh_token,
      otp_code,
      fcm_token,
      ...safe
    } = user as any;

    return safe;
  }
}