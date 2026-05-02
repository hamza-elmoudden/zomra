import { Module } from '@nestjs/common';
import { EVENTS_KAY } from './domain/repositories/events.repositories';
import { EventsInfrastructure } from './infrastructure/events.infrastructure';

@Module({
    providers:[
        {   provide:EVENTS_KAY,
            useClass:EventsInfrastructure
        }
    ]
})
export class EventsModule {}
