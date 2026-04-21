import { PrismaService } from "src/prisma/prisma.service";
import { Interests } from "../domain/entities/interests.entities";
import { InterestsRepositories } from "../domain/repositories/interests.repositories";




export class InterestsInfrastructure  implements InterestsRepositories{
    constructor(
        private readonly prisma:PrismaService
    ){}


    mapToInterests(data:any){
        return new Interests(data.id,data.name,data.icon,data.color_hex)
    }

    async create(data: Interests): Promise<Interests> {
        return await this.prisma.interests.create({
            data:{
                name:data.name,
                icon:data.icon,
                color_hex:data.color_hex
            }
        })
    }


    async delete(id: number): Promise<boolean> {
        const interests = await this.prisma.interests.delete({
            where:{
                id
            }
        })

        return interests ? true : false
    }


    async getAllInterests(): Promise<Interests[] | []> {
        const interests = await this.prisma.interests.findMany()

        return interests ? interests.map(itm => this.mapToInterests(itm)) : []
    }


    async getById(id: number): Promise<Interests | null> {
       const interests = await this.prisma.interests.findUnique({
        where:{
            id
        }
       })

       return interests
    }


    async getByName(name: string): Promise<Interests | null> {
       const interests = await this.prisma.interests.findUnique({
        where:{
            name
        }
       })

       return interests
    }
}