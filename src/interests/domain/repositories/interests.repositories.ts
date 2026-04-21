import { Interests } from "../entities/interests.entities";




export abstract class InterestsRepositories{
    abstract create(data:Interests):Promise<Interests>
    abstract delete(id:string):Promise<boolean>
    abstract getAllInterests():Promise<Interests[] | []>
    abstract getById(id:string):Promise<Interests | null>
    abstract getByName(name:string):Promise<Interests | null>
}
