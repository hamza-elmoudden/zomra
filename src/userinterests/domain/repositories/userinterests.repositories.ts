


export  abstract class UserInterests {
    abstract getOneUserInterest(id:string):Promise<UserInterests | null>
    abstract getAllUserInterests(usrId:string):Promise<UserInterests[] | []>
    abstract createUserInterest(userId:string,interest_id:string):Promise<UserInterests>
    abstract deleteUserInterest(id:string):Promise<boolean>
}