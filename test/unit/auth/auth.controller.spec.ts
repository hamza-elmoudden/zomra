import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/domain/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authService = {
      googleLogin: jest.fn(),
      rotateTokens: jest.fn(),
      logout: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('googleRedirect', () => {
    it('should return state with platform', () => {
      const req = { query: { platform: 'web' } };
      const result = controller.googleRedirect(req);
      expect(result).toEqual({ state: JSON.stringify({ platform: 'web' }) });
    });
  });

  describe('googleCallback', () => {
    it('should call authService.googleLogin and redirect', async () => {
      const user = { id: '1', email: 'test@test.com' } as User;
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      authService.googleLogin.mockResolvedValue(tokens as any);

      const req = { user, query: { state: '{}' } };
      const res = { redirect: jest.fn() };

      await controller.googleCallback(req as any, res as any);

      expect(authService.googleLogin).toHaveBeenCalledWith(user);
      expect(res.redirect).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should call authService.rotateTokens and set cookies', async () => {
      const user = { id: '1' } as User;
      const tokens = { accessToken: 'new-at', refreshToken: 'new-rt' };
      authService.rotateTokens.mockResolvedValue(tokens as any);

      const res = {
        cookie: jest.fn(),
      };

      const result = await controller.refresh(user, res as any);

      expect(authService.rotateTokens).toHaveBeenCalledWith(user);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-at', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new-rt', expect.any(Object));
      expect(result).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user id', async () => {
      const user = { id: 'user-1' } as User;
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(user);
      expect(authService.logout).toHaveBeenCalledWith('user-1');
      expect(result).toBeUndefined();
    });
  });

  describe('me', () => {
    it('should return user without sensitive fields', async () => {
      const user = {
        id: '1',
        username: 'test',
        email: 'test@test.com',
        password_hash: 'secret',
        refresh_token: 'secret',
        otp_code: '1234',
        fcm_token: 'token',
        role: 'user',
      } as any;

      const result = await controller.me(user);
      expect(result.password_hash).toBeUndefined();
      expect(result.refresh_token).toBeUndefined();
      expect(result.otp_code).toBeUndefined();
      expect(result.fcm_token).toBeUndefined();
      expect(result.id).toBe('1');
      expect(result.username).toBe('test');
    });
  });
});
