// src/auth/decorators/decorators.ts

import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ── @Roles(...roles) ─────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Roles enum matching your DB
export enum UserRole {
  USER   = 'user',
  ADMIN  = 'admin',
}

// ── @CurrentUser() ───────────────────────────────────────────
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user,
);