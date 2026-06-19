import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Review } from "../domain/entities/review.entity";
import { ReviewRepository } from "../domain/repositories/review.repository";

@Injectable()
export class ReviewInfrastructure implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SELECT = {
    id: true, reviewer_id: true, reviewed_user_id: true, event_id: true,
    rating: true, comment: true, created_at: true,
  } as const;

  private mapToReview(data: any): Review {
    return new Review(
      data.id,
      data.reviewer_id,
      data.reviewed_user_id,
      data.event_id,
      data.rating,
      data.comment ?? undefined,
      data.created_at ?? undefined,
    );
  }

  async create(data: Review): Promise<Review> {
    try {
      const review = await this.prisma.reviews.create({
        data: {
          reviewer_id: data.reviewer_id,
          reviewed_user_id: data.reviewed_user_id,
          event_id: data.event_id,
          rating: data.rating,
          comment: data.comment,
        },
      });
      return this.mapToReview(review);
    } catch (error) {
      throw new InternalServerErrorException("Failed to create review");
    }
  }

  async findByReviewerAndReviewedAndEvent(
    reviewerId: string,
    reviewedUserId: string,
    eventId: string,
  ): Promise<Review | null> {
    try {
      const data = await this.prisma.reviews.findUnique({
        where: {
          reviewer_id_reviewed_user_id_event_id: {
            reviewer_id: reviewerId,
            reviewed_user_id: reviewedUserId,
            event_id: eventId,
          },
        },
        select: this.SELECT,
      });
      return data ? this.mapToReview(data) : null;
    } catch (error) {
      throw new InternalServerErrorException("Failed to find review");
    }
  }

  async findByReviewedUser(userId: string): Promise<Review[]> {
    try {
      const data = await this.prisma.reviews.findMany({
        where: { reviewed_user_id: userId },
        select: this.SELECT,
        orderBy: { created_at: "desc" },
      });
      return data.map((r) => this.mapToReview(r));
    } catch (error) {
      throw new InternalServerErrorException("Failed to find reviews");
    }
  }

  async findAverageRatingForUser(userId: string): Promise<number | null> {
    try {
      const result = await this.prisma.reviews.aggregate({
        where: { reviewed_user_id: userId },
        _avg: { rating: true },
      });
      return result._avg.rating ?? null;
    } catch (error) {
      throw new InternalServerErrorException("Failed to calculate average rating");
    }
  }

  async countByReviewedUser(userId: string): Promise<number> {
    try {
      return this.prisma.reviews.count({
        where: { reviewed_user_id: userId },
      });
    } catch (error) {
      throw new InternalServerErrorException("Failed to count reviews");
    }
  }
}
