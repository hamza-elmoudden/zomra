import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { EVENTS_KAY, EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { event_status } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/users/domain/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    private readonly prisma: PrismaService,
  ) {}

  async createStaffUser(data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'observer';
  }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.userRepo.createStaffUser({
      username: data.username,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
    });
  }

  async suspendUser(userId: string, suspend: boolean) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = new User(
      user.id,
      user.username,
      user.email,
      user.google_id,
      user.phone,
      user.password_hash,
      user.full_name,
      user.bio,
      user.avatar_url,
      user.lat,
      user.lng,
      user.country,
      user.city,
      user.reputation_score,
      user.total_reviews,
      user.is_verified,
      suspend ? 'blocked' : 'active',
      user.created_at,
      user.role,
      user.refresh_token,
    );
    return this.userRepo.update(updated);
  }

  async suspendEvent(eventId: string, status: event_status) {
    const event = await this.eventRepo.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.eventRepo.update(eventId, { status } as any);
  }

  async addInterest(name: string, icon?: string, colorHex?: string) {
    return this.prisma.interests.create({
      data: { name, icon, color_hex: colorHex },
    });
  }

  async deleteReview(reviewId: string) {
    try {
      await this.prisma.reviews.delete({ where: { id: reviewId } });
    } catch {
      throw new NotFoundException('Review not found');
    }
  }

  async listStaffUsers() {
    const users = await this.prisma.users.findMany({
      where: {
        role: { in: ['admin', 'observer'] },
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
    return users;
  }
}
