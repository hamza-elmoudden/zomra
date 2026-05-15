import { Test, TestingModule } from '@nestjs/testing';
import { GetUserReviewsHandler } from 'src/reviews/application/queries/handler/get-user-reviews.handler';
import { ID_REVIEW_REPOSITORY, ReviewRepository } from 'src/reviews/domain/repositories/review.repository';
import { Review } from 'src/reviews/domain/entities/review.entity';
import { GetUserReviewsImpl } from 'src/reviews/application/queries/impl/get-user-reviews.impl';

describe('GetUserReviewsHandler', () => {
  let handler: GetUserReviewsHandler;
  let repo: jest.Mocked<ReviewRepository>;

  beforeEach(async () => {
    repo = { findByReviewedUser: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserReviewsHandler,
        { provide: ID_REVIEW_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetUserReviewsHandler>(GetUserReviewsHandler);
  });

  it('should return reviews for a user', async () => {
    const expected = [new Review('r1', 'reviewer-1', 'user-2', 'event-1', 5, 'Great!')];
    repo.findByReviewedUser.mockResolvedValue(expected);

    const result = await handler.execute(new GetUserReviewsImpl('user-2'));
    expect(repo.findByReviewedUser).toHaveBeenCalledWith('user-2');
    expect(result).toEqual(expected);
  });
});
