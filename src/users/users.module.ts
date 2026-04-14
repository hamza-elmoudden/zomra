import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from './api/users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ID_USER_REPOSITORY } from './domain/repositories/user.repository';
import { UserInfrastructure } from './infrastructure/user.infrastructure';
import { findUserByIdHandler } from './application/queries/handler/find-user-byId.handler';
import { CompleteUserHandler } from './application/commands/handler/complete-user.handler';

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [UsersController],
  providers: [
    {
      provide: ID_USER_REPOSITORY,
      useClass: UserInfrastructure,
    },
    findUserByIdHandler,
    CompleteUserHandler,
  ],
  exports: [ID_USER_REPOSITORY],  // AuthModule strategies inject this token
})
export class UsersModule {}
