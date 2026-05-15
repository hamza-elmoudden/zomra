import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export function generateJwt(
  payload: { sub: string; email: string; role: string },
  secret?: string,
): string {
  const jwtService = new JwtService({
    secret: secret || 'HUEJSIIW3838EU82II',
  });

  return jwtService.sign(payload, { expiresIn: '15m' });
}

export function createMockConfigService(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'HUEJSIIW3838EU82II',
        JWT_REFRESH_SECRET: 'HUEJSIIW3838EU82II',
        JWT_REFRESH_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:3001',
      };
      return map[key];
    },
    get: (key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'HUEJSIIW3838EU82II',
        JWT_REFRESH_SECRET: 'HUEJSIIW3838EU82II',
        JWT_REFRESH_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:3001',
      };
      return map[key];
    },
  } as unknown as ConfigService;
}
