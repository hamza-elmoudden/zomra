import { Review } from 'src/reviews/domain/entities/review.entity';
import { ReviewRepository } from 'src/reviews/domain/repositories/review.repository';
import * as crypto from 'crypto';

export class MockReviewRepository implements ReviewRepository {
  private reviews: Map<string, Review> = new Map();

  reset(): void {
    this.reviews.clear();
  }

  addReview(review: Review): void {
    this.reviews.set(review.id, review);
  }

  async create(data: Review): Promise<Review> {
    this.reviews.set(data.id, data);
    return data;
  }

  async findByReviewerAndReviewedAndEvent(
    reviewerId: string,
    reviewedUserId: string,
    eventId: string,
  ): Promise<Review | null> {
    return (
      [...this.reviews.values()].find(
        (r) =>
          r.reviewer_id === reviewerId &&
          r.reviewed_user_id === reviewedUserId &&
          r.event_id === eventId,
      ) ?? null
    );
  }

  async findByReviewedUser(userId: string): Promise<Review[]> {
    return [...this.reviews.values()].filter(
      (r) => r.reviewed_user_id === userId,
    );
  }

  async findAverageRatingForUser(userId: string): Promise<number | null> {
    const userReviews = [...this.reviews.values()].filter(
      (r) => r.reviewed_user_id === userId,
    );
    if (userReviews.length === 0) return null;
    const sum = userReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / userReviews.length;
  }

  async countByReviewedUser(userId: string): Promise<number> {
    return [...this.reviews.values()].filter(
      (r) => r.reviewed_user_id === userId,
    ).length;
  }
}

export function createMockReview(
  reviewerId: string,
  reviewedUserId: string,
  eventId: string,
  rating: number = 5,
  comment?: string,
): Review {
  return new Review(
    crypto.randomUUID(),
    reviewerId,
    reviewedUserId,
    eventId,
    rating,
    comment,
    new Date(),
  );
}
