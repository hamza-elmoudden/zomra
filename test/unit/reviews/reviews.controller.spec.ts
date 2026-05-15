import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ReviewsController } from 'src/reviews/api/reviews.controller';
import { User } from 'src/users/domain/entities/user.entity';
import { CreateReviewImpl } from 'src/reviews/application/commands/impl/create-review.impl';
import { GetUserReviewsImpl } from 'src/reviews/application/queries/impl/get-user-reviews.impl';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  const mockUser = { id: 'reviewer-1' } as User;

  describe('create', () => {
    it('should execute CreateReviewImpl', async () => {
      const dto = { reviewedUserId: 'user-2', eventId: 'event-1', rating: 5, comment: 'Great!' };
      const expected = { id: 'review-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateReviewImpl('reviewer-1', 'user-2', 'event-1', 5, 'Great!'),
      );
      expect(result).toEqual(expected);
    });

    it('should handle optional comment', async () => {
      const dto = { reviewedUserId: 'user-2', eventId: 'event-1', rating: 3 };
      commandBus.execute.mockResolvedValue({ id: 'review-2' });

      await controller.create(dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateReviewImpl('reviewer-1', 'user-2', 'event-1', 3, undefined),
      );
    });
  });

  describe('getByUser', () => {
    it('should execute GetUserReviewsImpl', async () => {
      const expected = [{ id: 'r1' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getByUser('user-2');
      expect(queryBus.execute).toHaveBeenCalledWith(new GetUserReviewsImpl('user-2'));
      expect(result).toEqual(expected);
    });
  });
});
