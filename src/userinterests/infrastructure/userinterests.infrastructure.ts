import { PrismaService } from "src/prisma/prisma.service";
import { UserInterests } from "../domain/entities/user.entities";
import { UserInterestsRepositories } from "../domain/repositories/userinterests.repositories";


export class UserInterestsInfrastructure implements UserInterestsRepositories{

    constructor(
        private readonly prisma :PrismaService
    ){}

    mapToUserInterest(data:any){
        return new UserInterests(
            data.id,
            data.user_id,
            data.interest_id,
            data.DateTime
        )
    }

    getOneUserInterest(id: string): Promise<UserInterests | null> {
        process.exit(0)
    }

   async getAllUserInterests(usrId: string): Promise<UserInterests[] | []> {
        const intre = await this.prisma.user_interests.findMany({
            where:{
                user_id:usrId
            }
        })

        return intre ? intre.map((item) => this.mapToUserInterest(item)) : []
    }

    async createUserInterest(userId: string, interest_id: number): Promise<UserInterests> {
        const intre = await this.prisma.user_interests.create({
            data:{
                user_id:userId,
                interest_id:interest_id
            }
        })

        return this.mapToUserInterest(intre)
    }

    deleteUserInterest(id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}