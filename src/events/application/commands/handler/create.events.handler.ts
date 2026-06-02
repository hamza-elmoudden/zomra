import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateEventsImpl } from "../impl/create.events.impl";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { Events } from "src/events/domain/entities/events.entities";



@CommandHandler(CreateEventsImpl)
export class CreateEventsHandler implements ICommandHandler<CreateEventsImpl> {

    constructor(
        @Inject(EVENTS_KAY)
        private readonly repo: EventsRepositories
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
            return data
        } catch (error) {
            console.error('error in create events :', error)
            throw new InternalServerErrorException('Error On Server In Create Events')
        }
    }
}