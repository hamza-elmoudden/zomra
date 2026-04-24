import { events } from "generated/prisma/client";
import { Events } from "../domain/entities/events.entities";
import { EventsRepositories } from "../domain/repositories/events.repositories";
import { PrismaService } from "src/prisma/prisma.service";


export class EventsInfrastructure implements EventsRepositories {


    constructor(
        private readonly prisma:PrismaService
    ){}

    mapToEvents(event: events): Events {
    return new Events(
        event.id,
        event.host_id,
        event.title,
        event.category,
        event.starts_at,

        event.duration_minutes,
        event.max_participants,
        event.current_count,

        event.status,
        event.is_public,

        event.description,
        event.address,
        event.city,

        event.cover_image_url,

        event.created_at,
        event.updated_at,

        event.lat,
        event.lng
    );
}

async create(data: Events): Promise < Events > {
    const events = await this.prisma.events.create({
        data
    })

    return this.mapToEvents(events)
}

async findById(id: string): Promise < Events | null > {
    const events = await this.prisma.events.findUnique({
        where:{
            id
        }
    })

    return events ? this.mapToEvents(events) : null
}

async findByCity(city: string): Promise < Events[] | [] > {
    const events = await this.prisma.events.findMany({
        where:{
            city
        }
    })

    return events ? events.map(itm => this.mapToEvents(events)) : []
}

findByLocation(lat: number, lng: number): Promise < Events[] | [] > {
    throw new Error("Method not implemented.");
}

findByCategory(category: string): Promise < Events[] | [] > {
    throw new Error("Method not implemented.");
}
}