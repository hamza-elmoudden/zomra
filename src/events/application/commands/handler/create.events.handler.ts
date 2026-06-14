import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateEventsImpl } from "../impl/create.events.impl";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { Events } from "src/events/domain/entities/events.entities";
import { EventParticipant } from "src/events/domain/entities/event-participant.entity";

@CommandHandler(CreateEventsImpl)
export class CreateEventsHandler implements ICommandHandler<CreateEventsImpl> {

    constructor(
        @Inject(EVENTS_KAY)
        private readonly repo: EventsRepositories,
        @Inject(EVENT_PARTICIPANT_KEY)
        private readonly participantRepo: EventParticipantRepository,
    ) { }

    async execute(command: CreateEventsImpl): Promise<Events> {
        const events = new Events(
            crypto.randomUUID(),
            command.host_id,
            command.title,
            command.category,
            command.starts_at,
            command.duration_minutes,
            command.max_participants,
            command.current_count,
            'open',
            true,
            command.description,
            command.address,
            command.city,
            undefined, undefined,
            command.lat,
            command.lng)

        try {
            const data = await this.repo.create(events)

            await this.participantRepo.create(new EventParticipant(
                crypto.randomUUID(),
                data.id,
                command.host_id,
                'accepted' as any,
                new Date(),
            ))

            return data
        } catch (error) {
            console.error('error in create events :', error)
            throw new InternalServerErrorException('Error On Server In Create Events')
        }
    }
}