import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../domain/entities/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';

@Injectable()
export class UserInfrastructure implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly PUBLIC_SELECT = {
    id: true, username: true, email: true, full_name: true, bio: true,
    avatar_url: true, lat: true, lng: true, country: true, city: true,
    reputation_score: true, total_reviews: true, is_verified: true,
    status: true, created_at: true, role: true,
  } as const;

  private readonly AUTH_SELECT = {
    ...this.PUBLIC_SELECT,
    password_hash: true, refresh_token: true, google_id: true, phone: true,
  } as const;

  // ─── Mapping ────────────────────────────────────────────────
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
      data.lat ?? undefined,
      data.lng ?? undefined,
      data.country ?? undefined,
      data.city ?? undefined,
      data.reputation_score ?? 5.0,
      data.total_reviews ?? 0,
      data.is_verified ?? false,
      data.status ?? 'active',
      data.created_at ?? new Date(),
      data.role ?? 'user',
      data.refresh_token ?? undefined,
    );
  }


  // ─── Create ─────────────────────────────────────────────────
  async create(user: User): Promise<string> {
    try {
      const data = await this.prisma.users.create({
        data: {
          username: user.username,
          email: user.email,
          google_id: user.google_id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          status: 'blocked',
        },
      });
      return data.id;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  // ─── Complete profile ────────────────────────────────────────
  async complete(user: User): Promise<boolean> {
    try {
      const data = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          phone: user.phone,
          full_name: user.full_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          lat: user.lat,
          lng: user.lng,
          country: user.country,
          city: user.city,
          reputation_score: user.reputation_score,
          is_verified: user.is_verified,
          status: user.status as any,
        },
      });
      return !!data;
    } catch (error) {
      throw new InternalServerErrorException('Failed to complete user profile');
    }
  }

  // ─── Update ─────────────────────────────────────────────────
  async update(user: User): Promise<boolean> {
    try {
      const data = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          phone: user.phone,
          full_name: user.full_name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          lat: user.lat,
          lng: user.lng,
          country: user.country,
          city: user.city,
          reputation_score: user.reputation_score,
        },
      });
      return !!data;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  // ─── Find by ID (public — no credentials) ────────────────────
  async findById(id: string): Promise<User | null> {
    try {
      const data = await this.prisma.users.findUnique({
        where: { id },
        select: this.PUBLIC_SELECT,
      });
      return data ? this.mapToUser(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by ID');
    }
  }

  // ─── Find by ID (auth — includes credentials) ────────────────
  async findByIdWithCredentials(id: string): Promise<User | null> {
    try {
      const data = await this.prisma.users.findUnique({
        where: { id },
        select: this.AUTH_SELECT,
      });
      return data ? this.mapToUser(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by ID');
    }
  }

  // ─── Find by Email (public — no credentials) ─────────────────
  async findByEmail(email: string): Promise<User | null> {
    try {
      const data = await this.prisma.users.findUnique({
        where: { email },
        select: this.PUBLIC_SELECT,
      });
      return data ? this.mapToUser(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  // ─── Find by Email (auth — includes credentials) ──────────────
  async findByEmailWithCredentials(email: string): Promise<User | null> {
    try {
      const data = await this.prisma.users.findUnique({
        where: { email },
        select: this.AUTH_SELECT,
      });
      return data ? this.mapToUser(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  // ─── Find by Google ID ───────────────────────────────────────
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const data = await this.prisma.users.findFirst({
        where: { google_id: googleId },
        select: this.PUBLIC_SELECT,
      });
      return data ? this.mapToUser(data) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user by Google ID');
    }
  }

  // ─── Find by City ────────────────────────────────────────────
  async findByCity(city: string): Promise<User[] | null> {
    try {
      const data = await this.prisma.users.findMany({
        where: { city },
        select: this.PUBLIC_SELECT,
      });
      return data.length ? data.map((d) => this.mapToUser(d)) : null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find users by city');
    }
  }

  // ─── Link Google ID to existing account ─────────────────────
  async linkGoogleId(userId: string, googleId: string): Promise<User> {
    try {
      const data = await this.prisma.users.update({
        where: { id: userId },
        data: { google_id: googleId },
        select: this.PUBLIC_SELECT,
      });
      return this.mapToUser(data);
    } catch (error) {
      throw new InternalServerErrorException('Failed to link Google account');
    }
  }

  // ─── Refresh token ───────────────────────────────────────────
  async saveRefreshToken(userId: string, hashedToken: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { refresh_token: hashedToken },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to save refresh token');
    }
  }

  async clearRefreshToken(userId: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { refresh_token: null },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to clear refresh token');
    }
  }

  // ─── Last login ──────────────────────────────────────────────
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { last_login: new Date() },
      }); 
    } catch {
      // last_login field may not exist in all schema versions — silently ignore
    }
  }

  // ─── Update partial ──────────────────────────────────────────
  async updatePartial(userId: string, data: {
    phone?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    lat?: number;
    lng?: number;
    country?: string;
    city?: string;
  }): Promise<boolean> {
    try {
      const result = await this.prisma.users.update({
        where: { id: userId },
        data: {
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.full_name !== undefined && { full_name: data.full_name }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
          ...(data.lat !== undefined && { lat: data.lat }),
          ...(data.lng !== undefined && { lng: data.lng }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.city !== undefined && { city: data.city }),
        },
      });
      return !!result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }

  // ─── Update status ────────────────────────────────────────────
  async updateStatus(userId: string, status: string): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { status: status as any },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user status');
    }
  }

  // ─── Find or create Google user ──────────────────────────────
  async findOrCreateGoogleUser(params: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<{ user: User; isNew: boolean }> {
    try {
      // 1. Check by google_id
      const byGoogleId = await this.prisma.users.findFirst({
        where: { google_id: params.googleId },
        select: this.PUBLIC_SELECT,
      });
      if (byGoogleId) {
        return { user: this.mapToUser(byGoogleId), isNew: false };
      }

      // 2. Check by email — link google_id to existing account
      const byEmail = await this.prisma.users.findUnique({
        where: { email: params.email },
        select: this.PUBLIC_SELECT,
      });
      if (byEmail) {
        const updated = await this.prisma.users.update({
          where: { id: byEmail.id },
          data: { google_id: params.googleId },
          select: this.PUBLIC_SELECT,
        });
        return { user: this.mapToUser(updated), isNew: false };
      }

      // 3. Create brand-new user (profile completion pending)
      const username = `${params.email.split('@')[0]}_${Date.now()}`;
      const created = await this.prisma.users.create({
        select: this.PUBLIC_SELECT,
        data: {
          email: params.email,
          google_id: params.googleId,
          full_name: params.fullName,
          avatar_url: params.avatarUrl,
          username,
          status: 'blocked',
        },
      });
      return { user: this.mapToUser(created), isNew: true };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find or create Google user',
      );
    }
  }

  async createStaffUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: 'admin' | 'observer';
  }): Promise<User> {
    try {
      const created = await this.prisma.users.create({
        select: this.PUBLIC_SELECT,
        data: {
          username: data.username,
          email: data.email,
          password_hash: data.passwordHash,
          full_name: data.fullName,
          role: data.role,
          status: 'active',
        },
      });
      return this.mapToUser(created);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create staff user');
    }
  }
}
