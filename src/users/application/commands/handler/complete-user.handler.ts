import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CompleteUserImpl } from '../impl/complete-user.impl';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { User } from 'src/users/domain/entities/user.entity';

@CommandHandler(CompleteUserImpl)
export class CompleteUserHandler implements ICommandHandler<CompleteUserImpl> {
  constructor(
    @Inject(ID_USER_REPOSITORY)
    private readonly repo: UserRepository,
  ) {}

  async execute(command: CompleteUserImpl): Promise<boolean> {
    const existing = await this.repo.findById(command.id);

    if (!existing) {
      throw new BadRequestException('Account User Not Found');
    }

    if (existing.status === 'active') {
      throw new BadRequestException('User profile is already complete');
    }

    const data = new User(
      command.id,
      existing.username,
      existing.email,
      existing.google_id,
      command.phone ?? existing.phone,
      existing.password_hash,
      command.full_name ?? existing.full_name,
      command.bio ?? existing.bio,
      existing.avatar_url,
      command.lat ?? existing.lat,
      command.lng ?? existing.lng,
      command.country ?? existing.country,
      command.city ?? existing.city,
      existing.reputation_score,
      existing.total_reviews,
      existing.is_verified,
      existing.status,
      existing.created_at,
      existing.role,
      existing.refresh_token,
    );

    data.status = 'active';

    try {
      return await this.repo.complete(data);
    } catch (error) {
      throw new InternalServerErrorException('Failed to complete user profile');
    }
  }
}
