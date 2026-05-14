import { UserInterests } from "../entities/user.entities";

export abstract class UserInterestsRepositories {
    abstract getAllUserInterests(userId: string): Promise<UserInterests[]>
    abstract getOneUserInterest(userId: string, interestId: number): Promise<UserInterests | null>
    abstract createUserInterest(userId: string, interestId: number): Promise<UserInterests>
    abstract deleteUserInterest(userId: string, interestId: number): Promise<void>
}
