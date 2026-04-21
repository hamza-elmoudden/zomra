import { Interests } from "../entities/interests.entities";




export abstract class InterestsRepositories{
    abstract create(data:Interests):Promise<Interests>
    abstract delete(id:number):Promise<boolean>
    abstract getAllInterests():Promise<Interests[] | []>
    abstract getById(id:number):Promise<Interests | null>
    abstract getByName(name:string):Promise<Interests | null>
}
