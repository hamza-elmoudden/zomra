import { User } from "../entities/user.entity";


export const ID_USER_REPOSITORY = 'ID_USER_REPOSITORY'


export abstract class UserRepository{
    abstract create(user:User):Promise<string>;
    abstract complete(user:User):Promise<boolean>;
    abstract update(user:User):Promise<boolean>;
    abstract findById(id:string):Promise<User | null>;
    abstract findByEmail(email:string):Promise<User | null>
    abstract findByCity(city:string):Promise<User[] | null>
}