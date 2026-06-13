import { Module, forwardRef } from '@nestjs/common';
import { EVENTS_KAY } from './domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY } from './domain/repositories/event-participant.repository';
import { EventsInfrastructure } from './infrastructure/events.infrastructure';
import { EventParticipantInfrastructure } from './infrastructure/event-participant.infrastructure';
import { CreateEventsHandler } from './application/commands/handler/create.events.handler';
import { UpdateEventHandler } from './application/commands/handler/update-event.handler';
import { DeleteEventHandler } from './application/commands/handler/delete-event.handler';
import { JoinEventHandler } from './application/commands/handler/join-event.handler';
import { LeaveEventHandler } from './application/commands/handler/leave-event.handler';
import { AcceptParticipantHandler } from './application/commands/handler/accept-participant.handler';
import { RejectParticipantHandler } from './application/commands/handler/reject-participant.handler';
import { GetEventByIdHandler } from './application/queries/handler/get-event-by-id.handler';
import { ListEventsHandler } from './application/queries/handler/list-events.handler';
import { GetNearbyEventsHandler } from './application/queries/handler/get-nearby-events.handler';
import { GetEventParticipantsHandler } from './application/queries/handler/get-event-participants.handler';
import { GetMyEventsHandler } from './application/queries/handler/get-my-events.handler';
import { GetMyJoinedEventsHandler } from './application/queries/handler/get-my-joined-events.handler';
import { EventsController } from './api/events.controller';
import { UsersModule } from 'src/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
    providers: [
        {
            provide: EVENTS_KAY,
            useClass: EventsInfrastructure,
        },
        {
            provide: EVENT_PARTICIPANT_KEY,
            useClass: EventParticipantInfrastructure,
        },
        CreateEventsHandler,
        UpdateEventHandler,
        DeleteEventHandler,
        JoinEventHandler,
        LeaveEventHandler,
        AcceptParticipantHandler,
        RejectParticipantHandler,
        GetEventByIdHandler,
        ListEventsHandler,
        GetNearbyEventsHandler,
        GetEventParticipantsHandler,
        GetMyEventsHandler,
        GetMyJoinedEventsHandler,
    ],
    controllers: [EventsController],
    exports: [EVENTS_KAY, EVENT_PARTICIPANT_KEY],
    imports: [UsersModule, PrismaModule, CqrsModule, forwardRef(() => MessagingModule)],
})
export class EventsModule {}
