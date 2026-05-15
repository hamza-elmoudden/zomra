import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CreateReviewHandler } from 'src/reviews/application/commands/handler/create-review.handler';
import { ID_REVIEW_REPOSITORY, ReviewRepository } from 'src/reviews/domain/repositories/review.repository';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { EVENTS_KAY, EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { Review } from 'src/reviews/domain/entities/review.entity';
import { User } from 'src/users/domain/entities/user.entity';
import { Events } from 'src/events/domain/entities/events.entities';
import { EventParticipant } from 'src/events/domain/entities/event-participant.entity';
import { CreateReviewImpl } from 'src/reviews/application/commands/impl/create-review.impl';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-review-uuid'),
}));

function mockEvent(id: string): Events {
  return new Events(id, 'host-1', 'Event', 'sports', new Date(), 60, 10, 5, 'open' as any, true);
}

function mockParticipant(eventId: string, userId: string, status: string = 'accepted'): EventParticipant {
  return new EventParticipant('p-' + userId, eventId, userId, status as any, new Date());
}

function mockUser(id: string): User {
  return new User(id, 'user_' + id, id + '@test.com', undefined, undefined, undefined, 'User ' + id);
}

describe('CreateReviewHandler', () => {
  let handler: CreateReviewHandler;
  let reviewRepo: jest.Mocked<ReviewRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    reviewRepo = {
      create: jest.fn(),
      findByReviewerAndReviewedAndEvent: jest.fn(),
      findAverageRatingForUser: jest.fn(),
      countByReviewedUser: jest.fn(),
    } as any;
    userRepo = { findById: jest.fn(), update: jest.fn() } as any;
    eventRepo = { findById: jest.fn() } as any;
    participantRepo = { findByEventAndUser: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReviewHandler,
        { provide: ID_REVIEW_REPOSITORY, useValue: reviewRepo },
        { provide: ID_USER_REPOSITORY, useValue: userRepo },
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<CreateReviewHandler>(CreateReviewHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validCommand = new CreateReviewImpl('reviewer-1', 'user-2', 'event-1', 5, 'Great!');

  function mockAllValid() {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(mockUser('user-2'));
    participantRepo.findByEventAndUser
      .mockResolvedValueOnce(mockParticipant('event-1', 'reviewer-1')) // reviewer is accepted
      .mockResolvedValueOnce(mockParticipant('event-1', 'user-2')); // reviewed is accepted
    reviewRepo.findByReviewerAndReviewedAndEvent.mockResolvedValue(null);
    reviewRepo.create.mockResolvedValue(
      new Review('generated-review-uuid', 'reviewer-1', 'user-2', 'event-1', 5, 'Great!'),
    );
    reviewRepo.findAverageRatingForUser.mockResolvedValue(5);
    reviewRepo.countByReviewedUser.mockResolvedValue(1);
    userRepo.update.mockResolvedValue(true);
  }

  it('should create a review successfully', async () => {
    mockAllValid();

    const result = await handler.execute(validCommand);

    expect(eventRepo.findById).toHaveBeenCalledWith('event-1');
    expect(userRepo.findById).toHaveBeenCalledWith('user-2');
    expect(reviewRepo.create).toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should update the reviewed user reputation', async () => {
    mockAllValid();

    await handler.execute(validCommand);

    expect(reviewRepo.findAverageRatingForUser).toHaveBeenCalledWith('user-2');
    expect(reviewRepo.countByReviewedUser).toHaveBeenCalledWith('user-2');
    expect(userRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        reputation_score: 5,
        total_reviews: 1,
      }),
    );
  });

  it('should throw BadRequestException if reviewing self', async () => {
    await expect(
      handler.execute(new CreateReviewImpl('user-1', 'user-1', 'event-1', 5)),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if rating is below 1', async () => {
    await expect(
      handler.execute(new CreateReviewImpl('reviewer-1', 'user-2', 'event-1', 0)),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if rating is above 5', async () => {
    await expect(
      handler.execute(new CreateReviewImpl('reviewer-1', 'user-2', 'event-1', 6)),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(validCommand)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if reviewed user does not exist', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(validCommand)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if reviewer is not an accepted participant', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(mockUser('user-2'));
    participantRepo.findByEventAndUser.mockResolvedValueOnce(null);

    await expect(handler.execute(validCommand)).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if reviewed user is not an accepted participant', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(mockUser('user-2'));
    participantRepo.findByEventAndUser
      .mockResolvedValueOnce(mockParticipant('event-1', 'reviewer-1'))
      .mockResolvedValueOnce(null);

    await expect(handler.execute(validCommand)).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException if review already exists', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(mockUser('user-2'));
    participantRepo.findByEventAndUser
      .mockResolvedValueOnce(mockParticipant('event-1', 'reviewer-1'))
      .mockResolvedValueOnce(mockParticipant('event-1', 'user-2'));
    reviewRepo.findByReviewerAndReviewedAndEvent.mockResolvedValue(
      new Review('existing', 'reviewer-1', 'user-2', 'event-1', 4),
    );

    await expect(handler.execute(validCommand)).rejects.toThrow(ConflictException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1'));
    userRepo.findById.mockResolvedValue(mockUser('user-2'));
    participantRepo.findByEventAndUser
      .mockResolvedValueOnce(mockParticipant('event-1', 'reviewer-1'))
      .mockResolvedValueOnce(mockParticipant('event-1', 'user-2'));
    reviewRepo.findByReviewerAndReviewedAndEvent.mockResolvedValue(null);
    reviewRepo.create.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(validCommand)).rejects.toThrow(InternalServerErrorException);
  });
});
