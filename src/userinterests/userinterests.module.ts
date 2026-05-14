import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { USER_INTERESTS } from './domain/entities/user.entities';
import { UserInterestsInfrastructure } from './infrastructure/userinterests.infrastructure';
import { AddUserInterestHandler } from './application/commands/handler/add-user-interest.handler';
import { RemoveUserInterestHandler } from './application/commands/handler/remove-user-interest.handler';
import { GetUserInterestsHandler } from './application/queries/handler/get-user-interests.handler';
import { GetOneUserInterestHandler } from './application/queries/handler/get-one-user-interest.handler';
import { UserInterestsController } from './api/userinterests.controller';

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [UserInterestsController],
  providers: [
    {
      provide: USER_INTERESTS,
      useClass: UserInterestsInfrastructure,
    },
    AddUserInterestHandler,
    RemoveUserInterestHandler,
    GetUserInterestsHandler,
    GetOneUserInterestHandler,
  ],
})
export class UserinterestsModule {}
