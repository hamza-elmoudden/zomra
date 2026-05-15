import { ForbiddenException } from '@nestjs/common';
import { ObserverGuard } from 'src/admin/guards/observer.guard';

describe('ObserverGuard', () => {
  let guard: ObserverGuard;

  beforeEach(() => {
    guard = new ObserverGuard();
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

  it('should allow access for observer role', () => {
    const ctx = mockContext({ role: 'observer' });
    expect(guard.canActivate(ctx)).toBe(true);
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
