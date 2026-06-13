import { event_status } from "generated/prisma/enums";
import { Events } from "../entities/events.entities";

export const EVENTS_KAY = "EVENTS_KAY"

export abstract class EventsRepositories{
    abstract create(data:Events):Promise<Events>
    abstract findById(id:string):Promise<Events | null>
    abstract findByCity(city:string):Promise<Events[]| []>
    abstract findByLocation(lat:number,lng:number):Promise<Events[] | []>
    abstract findByCategory(category:string):Promise<Events[] | []>
    abstract findByUser(host_id:string):Promise<Events[] | []>
    abstract findEventsByParticipant(userId: string): Promise<Events[]>
    abstract update(id: string, data: Partial<Events>): Promise<Events>
    abstract delete(id: string): Promise<void>
    abstract findAll(params: {
        city?: string
        category?: string
        status?: event_status
        page?: number
        limit?: number
    }): Promise<Events[]>
    abstract findNearby(lat: number, lng: number, radiusKm?: number): Promise<Events[]>
}