import { Module } from '@nestjs/common';
import { CreateInterestsHandler } from './application/commands/handler/create.interests.handler';
import { INTEREST_KAY } from './domain/entities/interests.entities';
import { InterestsInfrastructure } from './infrastructure/interests.infrastructure';
import { GetInterestsByIdHandler } from './application/queries/handler/get.interestsByid.handler';
import { GetAllInterestsHandler } from './application/queries/handler/getall.interests.handler';

@Module({
    providers:[
        CreateInterestsHandler,
        GetInterestsByIdHandler,
        GetAllInterestsHandler,
        {
            useClass:InterestsInfrastructure,
            provide:INTEREST_KAY
            
        }
    ]
})
export class InterestsModule {}
