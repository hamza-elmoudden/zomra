import { Review } from "../entities/review.entity";

export const ID_REVIEW_REPOSITORY = "ID_REVIEW_REPOSITORY";

export abstract class ReviewRepository {
  abstract create(data: Review): Promise<Review>;
  abstract findByReviewerAndReviewedAndEvent(reviewerId: string, reviewedUserId: string, eventId: string): Promise<Review | null>;
  abstract findByReviewedUser(userId: string): Promise<Review[]>;
  abstract findAverageRatingForUser(userId: string): Promise<number | null>;
  abstract countByReviewedUser(userId: string): Promise<number>;
}
