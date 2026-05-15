import { User } from '../entities/user.entity';

export const ID_USER_REPOSITORY = 'ID_USER_REPOSITORY';

export abstract class UserRepository {
  abstract create(user: User): Promise<string>;
  abstract complete(user: User): Promise<boolean>;
  abstract update(user: User): Promise<boolean>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract findByCity(city: string): Promise<User[] | null>;
  abstract linkGoogleId(userId: string, googleId: string): Promise<User>;
  abstract saveRefreshToken(userId: string, hashedToken: string): Promise<void>;
  abstract clearRefreshToken(userId: string): Promise<void>;
  abstract updateLastLogin(userId: string): Promise<void>;
  abstract findOrCreateGoogleUser(params: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<{ user: User; isNew: boolean }>;
  abstract createStaffUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: 'admin' | 'observer';
  }): Promise<User>;
}
