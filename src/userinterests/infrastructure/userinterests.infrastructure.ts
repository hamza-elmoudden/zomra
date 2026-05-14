import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { UserInterests } from "../domain/entities/user.entities";
import { UserInterestsRepositories } from "../domain/repositories/userinterests.repositories";

@Injectable()
export class UserInterestsInfrastructure implements UserInterestsRepositories {

    constructor(
        private readonly prisma: PrismaService,
    ) {}

    private mapToUserInterest(data: any): UserInterests {
        return new UserInterests(
            data.user_id,
            data.interest_id,
            data.created_at ?? undefined,
        )
    }

    async getAllUserInterests(userId: string): Promise<UserInterests[]> {
        try {
            const data = await this.prisma.user_interests.findMany({
                where: { user_id: userId },
            })
            return data.map((item) => this.mapToUserInterest(item))
        } catch (error) {
            throw new InternalServerErrorException('Failed to get user interests')
        }
    }

    async getOneUserInterest(userId: string, interestId: number): Promise<UserInterests | null> {
        try {
            const data = await this.prisma.user_interests.findUnique({
                where: {
                    user_id_interest_id: { user_id: userId, interest_id: interestId },
                },
            })
            return data ? this.mapToUserInterest(data) : null
        } catch (error) {
            throw new InternalServerErrorException('Failed to get user interest')
        }
    }

    async createUserInterest(userId: string, interestId: number): Promise<UserInterests> {
        try {
            const data = await this.prisma.user_interests.create({
                data: {
                    user_id: userId,
                    interest_id: interestId,
                },
            })
            return this.mapToUserInterest(data)
        } catch (error) {
            throw new InternalServerErrorException('Failed to create user interest')
        }
    }

    async deleteUserInterest(userId: string, interestId: number): Promise<void> {
        try {
            await this.prisma.user_interests.delete({
                where: {
                    user_id_interest_id: { user_id: userId, interest_id: interestId },
                },
            })
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete user interest')
        }
    }
}
