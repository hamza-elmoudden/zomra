import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateInterestsHandler } from './application/commands/handler/create.interests.handler';
import { INTEREST_KAY } from './domain/entities/interests.entities';
import { InterestsInfrastructure } from './infrastructure/interests.infrastructure';
import { GetInterestsByIdHandler } from './application/queries/handler/get.interestsByid.handler';
import { GetAllInterestsHandler } from './application/queries/handler/getall.interests.handler';
import { DeleteInterestsHandler } from './application/queries/handler/delete.interests.handler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InterestsController } from './api/interests.controller';

@Module({
    controllers:[
        InterestsController
    ],
    imports:[
        PrismaModule,
        CqrsModule,
    ],
    providers:[
        CreateInterestsHandler,
        GetInterestsByIdHandler,
        GetAllInterestsHandler,
        DeleteInterestsHandler,
        {
            useClass:InterestsInfrastructure,
            provide:INTEREST_KAY
            
        }
    ]
})
export class InterestsModule {}
