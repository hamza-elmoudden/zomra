import { Module } from '@nestjs/common';
import { EVENTS_KAY } from './domain/repositories/events.repositories';
import { EventsInfrastructure } from './infrastructure/events.infrastructure';
import { CreateEventsHandler } from './application/commands/handler/create.events.handler';
import { EventsController } from './api/events.controller';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
    providers:[
        {   provide:EVENTS_KAY,
            useClass:EventsInfrastructure
        },
        CreateEventsHandler
    ],
    controllers:[EventsController],
    exports:[EVENTS_KAY],
    imports:[UsersModule,PrismaModule,CqrsModule]
})
export class EventsModule {}
