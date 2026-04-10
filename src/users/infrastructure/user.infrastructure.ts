import { PrismaService } from "src/prisma/prisma.service";
import { User } from "../domain/entities/user.entity";
import { UserRepository } from "../domain/repositories/user.repository";



type UserEntity = {
    id: string;
    username: string;
    email: string;
    google_id?: string;
    phone?: string;
    password_hash?: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    location?: any;
    country?: string;
    city?: string;
    reputation_score: number;
    total_reviews: number;
    is_verified: boolean;
    is_active: boolean;
    created_at: Date;
};

export class UserInfrastructure implements UserRepository {

    constructor(
        private readonly impl: PrismaService
    ) { }

    mapToUser(data: any): User {
        return new User(
            data.id,
            data.username,
            data.email,
            data.google_id ?? undefined,
            data.phone ?? undefined,
            data.password_hash ?? undefined,
            data.full_name ?? undefined,
            data.bio ?? undefined,
            data.avatar_url ?? undefined,
            data.location,
            data.country ?? undefined,
            data.city ?? undefined,
            data.reputation_score,
            data.total_reviews,
            data.is_verified,
            data.is_active,
            data.created_at,
        );
    }


    async create(user: User): Promise<string> {
        const data = await this.impl.users.create({
            data: {
                username: user.username,
                email: user.email,
                google_id: user.google_id,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
            },
        });

        return data.id;
    }

    async complete(user: User): Promise<boolean> {
        const data = await this.impl.users.update({
            where:{
                id:user.id
            },
            data: {
                phone: user.phone,
                full_name: user.full_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
                country: user.country,
                city: user.city,
                location: user.location,
                reputation_score: user.reputation_score,
                is_verified: user.is_verified,
                is_active: user.is_active,
                
            },
        });

        return data ? true : false;
    }

    async update(user:User):Promise<boolean>{
        const data = await this.impl.users.update({
            where:{
                id:user.id
            },
            data: {
                phone: user.phone,
                full_name: user.full_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
                country: user.country,
                city: user.city,
                location: user.location,
                reputation_score: user.reputation_score,
   
            },
        })

        return data ? true : false
    }

    async findById(id: string): Promise<User | null> {
        const data = await this.impl.users.findUnique({
            where: {
                id
            }
        })

        return data ? this.mapToUser(data) : null

    }


    async findByEmail(email: string): Promise<User | null> {
        const data = await this.impl.users.findUnique({
            where:{
                email
            }
        })

        return data ? this.mapToUser(data) : null
    }


    async findByCity(city: string): Promise<User[] | null> {
        const data = await this.impl.users.findMany({
            where:{
                city
            }
        })

        return data ? data.map(d => this.mapToUser(d)) : null
    }

}