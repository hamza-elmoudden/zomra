import { User } from 'src/users/domain/entities/user.entity';
import { UserRepository } from 'src/users/domain/repositories/user.repository';
import * as crypto from 'crypto';

export class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  reset(): void {
    this.users.clear();
  }

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  async create(user: User): Promise<string> {
    const id = crypto.randomUUID();
    this.users.set(id, user);
    return id;
  }

  async complete(user: User): Promise<boolean> {
    this.users.set(user.id, user);
    return true;
  }

  async update(user: User): Promise<boolean> {
    this.users.set(user.id, user);
    return true;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.google_id === googleId) ?? null;
  }

  async findByCity(city: string): Promise<User[] | null> {
    const users = [...this.users.values()].filter((u) => u.city === city);
    return users.length ? users : null;
  }

  async linkGoogleId(userId: string, googleId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updated = new User(
      user.id, user.username, user.email, googleId, user.phone,
      user.password_hash, user.full_name, user.bio, user.avatar_url,
      user.lat, user.lng, user.country, user.city,
      user.reputation_score, user.total_reviews, user.is_verified,
      user.status, user.created_at, user.role, user.refresh_token,
    );
    this.users.set(userId, updated);
    return updated;
  }

  async saveRefreshToken(userId: string, hashedToken: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const updated = new User(
        user.id, user.username, user.email, user.google_id, user.phone,
        user.password_hash, user.full_name, user.bio, user.avatar_url,
        user.lat, user.lng, user.country, user.city,
        user.reputation_score, user.total_reviews, user.is_verified,
        user.status, user.created_at, user.role, hashedToken,
      );
      this.users.set(userId, updated);
    }
  }

  async clearRefreshToken(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const updated = new User(
        user.id, user.username, user.email, user.google_id, user.phone,
        user.password_hash, user.full_name, user.bio, user.avatar_url,
        user.lat, user.lng, user.country, user.city,
        user.reputation_score, user.total_reviews, user.is_verified,
        user.status, user.created_at, user.role, undefined,
      );
      this.users.set(userId, updated);
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    // no-op in mock
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }
  }

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
    const user = this.users.get(userId);
    if (!user) return false;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.full_name !== undefined) user.full_name = data.full_name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.avatar_url !== undefined) user.avatar_url = data.avatar_url;
    if (data.lat !== undefined) user.lat = data.lat;
    if (data.lng !== undefined) user.lng = data.lng;
    if (data.country !== undefined) user.country = data.country;
    if (data.city !== undefined) user.city = data.city;
    return true;
  }

  async findOrCreateGoogleUser(params: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.findByGoogleId(params.googleId);
    if (existing) return { user: existing, isNew: false };

    const existingEmail = await this.findByEmail(params.email);
    if (existingEmail) {
      const linked = await this.linkGoogleId(existingEmail.id, params.googleId);
      return { user: linked, isNew: false };
    }

    const id = crypto.randomUUID();
    const user = new User(
      id,
      `${params.email.split('@')[0]}_${Date.now()}`,
      params.email, params.googleId, undefined, undefined,
      params.fullName, undefined, params.avatarUrl,
      undefined, undefined, undefined, undefined,
      5.0, 0, false, 'blocked', new Date(), 'user', undefined,
    );
    this.users.set(id, user);
    return { user, isNew: true };
  }

  async createStaffUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: 'admin' | 'observer';
  }): Promise<User> {
    const id = crypto.randomUUID();
    const user = new User(
      id, data.username, data.email, undefined, undefined,
      data.passwordHash, data.fullName, undefined, undefined,
      undefined, undefined, undefined, undefined,
      5.0, 0, false, 'active', new Date(), data.role, undefined,
    );
    this.users.set(id, user);
    return user;
  }
}

export function createMockUser(): User {
  const id = crypto.randomUUID();
  return new User(
    id, `user_${id.slice(0, 8)}`, `user_${id.slice(0, 8)}@test.com`,
    undefined, undefined, undefined, 'Test User', undefined, undefined,
    undefined, undefined, 'Morocco', 'Casablanca',
    5.0, 0, false, 'active', new Date(), 'user', undefined,
  );
}
