import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ID_USER_REPOSITORY } from './domain/repositories/user.repository';
import { UserInfrastructure } from './infrastructure/user.infrastructure';

@Module({
    controllers:[UsersController],
    imports:[PrismaModule],
    providers:[
        {
            provide:ID_USER_REPOSITORY,
            useClass:UserInfrastructure
        }
    ]
})
export class UsersModule {}
