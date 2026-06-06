import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserStatusImpl } from '../impl/update-user-status.impl';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { Inject, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/domain/entities/user.entity';

@CommandHandler(UpdateUserStatusImpl)
export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusImpl> {
  constructor(
    @Inject(ID_USER_REPOSITORY)
    private readonly repo: UserRepository,
  ) {}

  async execute(command: UpdateUserStatusImpl): Promise<User> {
    const existing = await this.repo.findById(command.userId);

    if (!existing) {
      throw new NotFoundException('User Not Found');
    }

    await this.repo.updateStatus(command.userId, command.status);
    existing.status = command.status;
    return existing;
  }
}
