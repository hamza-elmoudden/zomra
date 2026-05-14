import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetUserReviewsImpl } from "../impl/get-user-reviews.impl";
import { Inject, NotFoundException } from "@nestjs/common";
import { ID_REVIEW_REPOSITORY, ReviewRepository } from "src/reviews/domain/repositories/review.repository";
import { Review } from "src/reviews/domain/entities/review.entity";

@QueryHandler(GetUserReviewsImpl)
export class GetUserReviewsHandler implements IQueryHandler<GetUserReviewsImpl> {

  constructor(
    @Inject(ID_REVIEW_REPOSITORY)
    private readonly repo: ReviewRepository,
  ) {}

  async execute(query: GetUserReviewsImpl): Promise<Review[]> {
    return this.repo.findByReviewedUser(query.userId);
  }
}
