import { Injectable } from "@nestjs/common";
import { event_participants } from "generated/prisma/client";
import { EventParticipant } from "../domain/entities/event-participant.entity";
import { EventParticipantRepository } from "../domain/repositories/event-participant.repository";
import { PrismaService } from "src/prisma/prisma.service";
import { participant_status } from "generated/prisma/enums";

@Injectable()
export class EventParticipantInfrastructure implements EventParticipantRepository {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    private mapToParticipant(data: event_participants): EventParticipant {
        return new EventParticipant(
            data.id,
            data.event_id,
            data.user_id,
            data.status,
            data.joined_at,
        )
    }

    async create(data: EventParticipant): Promise<EventParticipant> {
        const participant = await this.prisma.event_participants.create({
            data: {
                id: data.id,
                event_id: data.event_id,
                user_id: data.user_id,
                status: data.status,
                joined_at: data.joined_at,
            },
        })
        return this.mapToParticipant(participant)
    }

    async delete(id: string): Promise<void> {
        await this.prisma.event_participants.delete({ where: { id } })
    }

    async findById(id: string): Promise<EventParticipant | null> {
        const data = await this.prisma.event_participants.findUnique({ where: { id } })
        return data ? this.mapToParticipant(data) : null
    }

    async findByEventId(eventId: string): Promise<EventParticipant[]> {
        const data = await this.prisma.event_participants.findMany({
            where: { event_id: eventId },
        })
        return data.map(itm => this.mapToParticipant(itm))
    }

    async findByEventAndUser(eventId: string, userId: string): Promise<EventParticipant | null> {
        const data = await this.prisma.event_participants.findUnique({
            where: { event_id_user_id: { event_id: eventId, user_id: userId } },
        })
        return data ? this.mapToParticipant(data) : null
    }

    async updateStatus(id: string, status: participant_status): Promise<EventParticipant> {
        const data = await this.prisma.event_participants.update({
            where: { id },
            data: { status },
        })
        return this.mapToParticipant(data)
    }

    async countByEventId(eventId: string): Promise<number> {
        return this.prisma.event_participants.count({
            where: { event_id: eventId, status: 'accepted' },
        })
    }
}
