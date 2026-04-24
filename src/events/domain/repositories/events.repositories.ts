import { Events } from "../entities/events.entities";





export abstract class EventsRepositories{
    abstract create(data:Events):Promise<Events>
    abstract findById(id:string):Promise<Events | null>
    abstract findByCity(city:string):Promise<Events[]| []>
    abstract findByLocation(lat:number,lng:number):Promise<Events[] | []>
    abstract findByCategory(category:string):Promise<Events[] | []>
}