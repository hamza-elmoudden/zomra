import { UserInterests } from "../entities/user.entities";



export  abstract class UserInterestsRepositories {
    abstract getOneUserInterest(id:string):Promise<UserInterests | null>
    abstract getAllUserInterests(usrId:string):Promise<UserInterests[] | []>
    abstract createUserInterest(userId:string,interest_id:number):Promise<UserInterests>
    abstract deleteUserInterest(id:string):Promise<boolean>
}