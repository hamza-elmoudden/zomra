import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindUserByEmailImpl } from '../impl/find-user-by-email.impl';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { Inject, NotFoundException } from '@nestjs/common';
import { User } from 'src/users/domain/entities/user.entity';

@QueryHandler(FindUserByEmailImpl)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailImpl> {
  constructor(
    @Inject(ID_USER_REPOSITORY)
    private readonly repo: UserRepository,
  ) {}

  async execute(query: FindUserByEmailImpl): Promise<User> {
    const user = await this.repo.findByEmail(query.email);

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }
}
