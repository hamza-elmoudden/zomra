import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserProfileImpl } from '../impl/update-user-profile.impl';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';

@CommandHandler(UpdateUserProfileImpl)
export class UpdateUserProfileHandler implements ICommandHandler<UpdateUserProfileImpl> {
  constructor(
    @Inject(ID_USER_REPOSITORY)
    private readonly repo: UserRepository,
  ) {}

  async execute(command: UpdateUserProfileImpl): Promise<boolean> {
    const existing = await this.repo.findById(command.userId);

    if (!existing) {
      throw new NotFoundException('User Not Found');
    }

    try {
      return await this.repo.updatePartial(command.userId, {
        phone: command.phone,
        full_name: command.full_name,
        bio: command.bio,
        avatar_url: command.avatar_url,
        lat: command.lat,
        lng: command.lng,
        country: command.country,
        city: command.city,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user profile');
    }
  }
}
