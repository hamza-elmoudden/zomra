import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AdminAuthService } from 'src/admin/admin-auth.service';
import { ID_USER_REPOSITORY } from 'src/users/domain/repositories/user.repository';
import { MockUserRepository } from 'test/mocks/repositories/mock-user-repository';
import { User } from 'src/users/domain/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed_refresh_token'),
  }),
}));

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let userRepo: MockUserRepository;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    userRepo = new MockUserRepository();

    jwtService = {
      sign: jest.fn(),
    } as any;

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'HUEJSIIW3838EU82II',
          JWT_REFRESH_SECRET: 'HUEJSIIW3838EU82II',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return map[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: ID_USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login an admin successfully', async () => {
      const admin = new User(
        'admin-id', 'admin1', 'admin@test.com',
        undefined, undefined, 'hashed_pw', 'Admin User',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'admin', undefined,
      );
      userRepo.addUser(admin);

      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login('admin@test.com', '123456789');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-access-token');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe('admin');
    });

    it('should login an observer successfully', async () => {
      const observer = new User(
        'obs-id', 'observer1', 'observer@test.com',
        undefined, undefined, 'hashed_pw', 'Observer User',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'observer', undefined,
      );
      userRepo.addUser(observer);

      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.login('observer@test.com', 'password');
      expect(result.user.role).toBe('observer');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      await expect(
        service.login('nonexistent@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-staff role', async () => {
      const regularUser = new User(
        'user-id', 'user1', 'user@test.com',
        undefined, undefined, 'hashed_pw', 'Regular User',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'user', undefined,
      );
      userRepo.addUser(regularUser);

      await expect(
        service.login('user@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no password_hash', async () => {
      const googleAdmin = new User(
        'admin-id', 'admin1', 'admin@test.com',
        'google-id', undefined, undefined, 'Admin',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'admin', undefined,
      );
      userRepo.addUser(googleAdmin);

      await expect(
        service.login('admin@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const admin = new User(
        'admin-id', 'admin1', 'admin@test.com',
        undefined, undefined, 'hashed_pw', 'Admin',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'admin', undefined,
      );
      userRepo.addUser(admin);

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login('admin@test.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should generate and store refresh token hash', async () => {
      const admin = new User(
        'admin-id', 'admin1', 'admin@test.com',
        undefined, undefined, 'hashed_pw', 'Admin',
        undefined, undefined, undefined, undefined,
        undefined, undefined, 5.0, 0, false, true,
        new Date(), 'admin', undefined,
      );
      userRepo.addUser(admin);

      jwtService.sign.mockReturnValue('refresh-token-value');

      await service.login('admin@test.com', 'password');

      const updated = await userRepo.findById('admin-id');
      expect(updated?.refresh_token).toBe('hashed_refresh_token');
    });
  });
});
