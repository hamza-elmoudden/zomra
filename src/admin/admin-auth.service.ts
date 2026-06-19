import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmailWithCredentials(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'admin' && user.role !== 'observer') {
      throw new UnauthorizedException('Access denied. Staff only.');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.updateLastLogin(user.id);

    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: '2h',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.userRepo.saveRefreshToken(user.id, hashed);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  }
}
