import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from 'src/admin/guards/admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  function mockContext(user: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access for admin role', () => {
    const ctx = mockContext({ role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access for observer role', () => {
    const ctx = mockContext({ role: 'observer' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny access for user role', () => {
    const ctx = mockContext({ role: 'user' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if no user', () => {
    const ctx = mockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
