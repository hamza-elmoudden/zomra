import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Interests } from "../domain/entities/interests.entities";
import { InterestsRepositories } from "../domain/repositories/interests.repositories";

@Injectable()
export class InterestsInfrastructure  implements InterestsRepositories{
    constructor(
        private readonly prisma:PrismaService
    ){}

    private readonly SELECT = {
        id: true, name: true, icon: true, color_hex: true,
    } as const;

    mapToInterests(data: any): Interests {
        return new Interests(
            data.id,
            data.name,
            data.icon ?? undefined,
            data.color_hex ?? undefined,
        )
    }

    async create(data: Interests): Promise<Interests> {
        const result = await this.prisma.interests.create({
            data:{
                name:data.name,
                icon:data.icon,
                color_hex:data.color_hex
            }
        })
        return this.mapToInterests(result)
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
        const interests = await this.prisma.interests.findMany({
            select: this.SELECT,
        })

        return interests.map(itm => this.mapToInterests(itm))
    }


    async getById(id: number): Promise<Interests | null> {
        const result = await this.prisma.interests.findUnique({
            where: { id },
            select: this.SELECT,
        })

        return result ? this.mapToInterests(result) : null
    }


    async getByName(name: string): Promise<Interests | null> {
        const result = await this.prisma.interests.findUnique({
            where: { name },
            select: this.SELECT,
        })

        return result ? this.mapToInterests(result) : null
    }
}
