import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthService } from 'src/auth/auth.service';
import { ID_USER_REPOSITORY } from 'src/users/domain/repositories/user.repository';
import { MockUserRepository, createMockUser } from 'test/mocks/repositories/mock-user-repository';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed_refresh_token'),
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
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
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: ID_USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('googleLogin', () => {
    it('should generate tokens for a user', async () => {
      const user = createMockUser();
      userRepo.addUser(user);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.googleLogin(user);

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.expiresIn).toBe(900);
    });

    it('should update last login', async () => {
      const user = createMockUser();
      userRepo.addUser(user);
      jwtService.sign.mockReturnValue('mock-token');

      jest.spyOn(userRepo, 'updateLastLogin');

      await service.googleLogin(user);
      expect(userRepo.updateLastLogin).toHaveBeenCalledWith(user.id);
    });
  });

  describe('rotateTokens', () => {
    it('should clear old refresh token and generate new ones', async () => {
      const user = createMockUser();
      userRepo.addUser(user);
      userRepo.saveRefreshToken(user.id, 'old-hash');
      jwtService.sign.mockReturnValue('new-token');

      jest.spyOn(userRepo, 'clearRefreshToken');

      const result = await service.rotateTokens(user);

      expect(userRepo.clearRefreshToken).toHaveBeenCalledWith(user.id);
      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      const user = createMockUser();
      userRepo.addUser(user);

      jest.spyOn(userRepo, 'clearRefreshToken');

      await service.logout(user.id);
      expect(userRepo.clearRefreshToken).toHaveBeenCalledWith(user.id);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const user = createMockUser();
      userRepo.addUser(user);

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.generateTokens(user);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(900);
    });

    it('should store hashed refresh token in user repo', async () => {
      const user = createMockUser();
      userRepo.addUser(user);
      jwtService.sign.mockReturnValue('refresh-token');

      await service.generateTokens(user);

      const updated = await userRepo.findById(user.id);
      expect(updated?.refresh_token).toBe('hashed_refresh_token');
    });
  });
});
