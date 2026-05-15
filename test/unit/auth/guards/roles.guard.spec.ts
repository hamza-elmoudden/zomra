import { Reflector } from '@nestjs/core';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/decorators/decorators';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  function mockContext(handler: any = {}, cls: any = {}) {
    return {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  let user: any;

  it('should allow access if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    user = { role: 'user' };

    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow access if user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    user = { role: 'admin' };

    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    user = { role: 'user' };

    expect(guard.canActivate(mockContext())).toBe(false);
  });

  it('should deny access if no user', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    user = undefined;

    expect(guard.canActivate(mockContext())).toBe(false);
  });

  it('should allow access if user has one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'observer']);
    user = { role: 'observer' };

    expect(guard.canActivate(mockContext())).toBe(true);
  });
});
