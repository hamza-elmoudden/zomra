import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    
    return {
      scope: ['email', 'profile'],
      state: JSON.stringify({
        platform: req.query.platform,
      }),
    };
  }
}