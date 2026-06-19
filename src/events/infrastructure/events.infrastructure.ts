import { Injectable } from "@nestjs/common";

import { Events } from "../domain/entities/events.entities";
import { EventsRepositories } from "../domain/repositories/events.repositories";
import { PrismaService } from "src/prisma/prisma.service";
import { event_status } from "generated/prisma/enums";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class EventsInfrastructure implements EventsRepositories {

    constructor(
        private readonly prisma: PrismaService
    ) {}

    private readonly LIST_SELECT = {
        id: true, host_id: true, title: true, category: true, starts_at: true,
        duration_minutes: true, max_participants: true, current_count: true,
        status: true, is_public: true, city: true, lat: true, lng: true,
    } as const;

    private readonly DETAIL_SELECT = {
        id: true, host_id: true, title: true, description: true, category: true,
        address: true, city: true, starts_at: true, duration_minutes: true,
        max_participants: true, current_count: true, status: true,
        is_public: true, created_at: true, updated_at: true, lat: true, lng: true,
    } as const;

    mapToEvents(event: any): Events {
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

            event.description ?? undefined,
            event.address ?? undefined,
            event.city ?? undefined,

            event.created_at ?? undefined,
            event.updated_at ?? undefined,

            event.lat ?? undefined,
            event.lng ?? undefined
        );
    }

    async create(data: Events): Promise<Events> {
        const events = await this.prisma.events.create({
            data: {
                id: data.id,
                host_id: data.host_id,
                title: data.title,
                description: data.description,
                category: data.category,
                address: data.address,
                city: data.city,
                starts_at: data.starts_at,
                duration_minutes: data.duration_minutes,
                max_participants: data.max_participants,
                current_count: data.current_count,
                status: data.status,
                is_public: data.is_public,
                lat: data.lat,
                lng: data.lng,
            },
        })

        return this.mapToEvents(events)
    }

    async findById(id: string): Promise<Events | null> {
        const event = await this.prisma.events.findUnique({
            where: { id },
            select: this.DETAIL_SELECT,
        })

        return event ? this.mapToEvents(event) : null
    }

    async findByCity(city: string): Promise<Events[] | []> {
        const events = await this.prisma.events.findMany({
            where: { city },
            select: this.LIST_SELECT,
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async findByLocation(lat: number, lng: number): Promise<Events[] | []> {
        const events = await this.prisma.events.findMany({
            where: { lat, lng },
            select: this.LIST_SELECT,
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async findByCategory(category: string): Promise<Events[] | []> {
        const events = await this.prisma.events.findMany({
            where: { category },
            select: this.LIST_SELECT,
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async findByUser(host_id: string): Promise<Events[] | []> {
        const events = await this.prisma.events.findMany({
            where: { host_id },
            select: this.LIST_SELECT,
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async findEventsByParticipant(userId: string): Promise<Events[]> {
        const events = await this.prisma.events.findMany({
            where: {
                event_participants: {
                    some: { user_id: userId },
                },
            },
            select: this.LIST_SELECT,
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async update(id: string, data: Partial<Events>): Promise<Events> {
        const { id: _, created_at, updated_at, ...safeData } = data as any
        const event = await this.prisma.events.update({
            where: { id },
            data: { ...safeData, updated_at: new Date() },
        })
        return this.mapToEvents(event)
    }

    async delete(id: string): Promise<void> {
        await this.prisma.events.delete({
            where: { id },
        })
    }

    async findAll(params: {
        city?: string
        category?: string
        status?: event_status
        page?: number
        limit?: number
    }): Promise<Events[]> {
        const { city, category, status, page = 1, limit = 20 } = params
        const skip = (page - 1) * limit

        const where: any = {}
        if (city) where.city = city
        if (category) where.category = category
        if (status) where.status = status

        const events = await this.prisma.events.findMany({
            where,
            skip,
            take: limit,
            select: this.LIST_SELECT,
            orderBy: { starts_at: 'asc' },
        })

        return events.map(itm => this.mapToEvents(itm))
    }

    async findNearby(lat: number, lng: number, radiusKm: number = 50): Promise<Events[]> {
        const latDelta = radiusKm / 111
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180))

        const events = await this.prisma.events.findMany({
            where: {
                lat: { gte: lat - latDelta, lte: lat + latDelta },
                lng: { gte: lng - lngDelta, lte: lng + lngDelta },
            },
            select: this.LIST_SELECT,
        })

        return events
            .filter(e => e.lat != null && e.lng != null && haversineDistance(lat, lng, e.lat, e.lng) <= radiusKm)
            .map(e => this.mapToEvents(e))
    }
}