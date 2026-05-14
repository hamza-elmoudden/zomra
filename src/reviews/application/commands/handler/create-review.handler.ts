import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateReviewImpl } from "../impl/create-review.impl";
import { Inject, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common";
import { ID_REVIEW_REPOSITORY, ReviewRepository } from "src/reviews/domain/repositories/review.repository";
import { Review } from "src/reviews/domain/entities/review.entity";
import { ID_USER_REPOSITORY, UserRepository } from "src/users/domain/repositories/user.repository";
import { EVENTS_KAY, EventsRepositories } from "src/events/domain/repositories/events.repositories";
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from "src/events/domain/repositories/event-participant.repository";
import { User } from "src/users/domain/entities/user.entity";

@CommandHandler(CreateReviewImpl)
export class CreateReviewHandler implements ICommandHandler<CreateReviewImpl> {

  constructor(
    @Inject(ID_REVIEW_REPOSITORY)
    private readonly reviewRepo: ReviewRepository,
    @Inject(ID_USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(EVENTS_KAY)
    private readonly eventRepo: EventsRepositories,
    @Inject(EVENT_PARTICIPANT_KEY)
    private readonly participantRepo: EventParticipantRepository,
  ) {}

  async execute(command: CreateReviewImpl): Promise<Review> {
    if (command.reviewerId === command.reviewedUserId) {
      throw new BadRequestException("You cannot review yourself");
    }

    if (command.rating < 1 || command.rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5");
    }

    const event = await this.eventRepo.findById(command.eventId);
    if (!event) {
      throw new NotFoundException(`Event with id ${command.eventId} not found`);
    }

    const reviewedUser = await this.userRepo.findById(command.reviewedUserId);
    if (!reviewedUser) {
      throw new NotFoundException(`User with id ${command.reviewedUserId} not found`);
    }

    const participant = await this.participantRepo.findByEventAndUser(command.eventId, command.reviewerId);
    if (!participant || participant.status !== "accepted") {
      throw new BadRequestException("You must be an accepted participant of this event to leave a review");
    }

    const reviewedParticipant = await this.participantRepo.findByEventAndUser(command.eventId, command.reviewedUserId);
    if (!reviewedParticipant || reviewedParticipant.status !== "accepted") {
      throw new BadRequestException("The reviewed user must be an accepted participant of this event");
    }

    const existing = await this.reviewRepo.findByReviewerAndReviewedAndEvent(
      command.reviewerId, command.reviewedUserId, command.eventId,
    );
    if (existing) {
      throw new ConflictException("You have already reviewed this user for this event");
    }

    const review = new Review(
      crypto.randomUUID(),
      command.reviewerId,
      command.reviewedUserId,
      command.eventId,
      command.rating,
      command.comment,
    );

    try {
      const result = await this.reviewRepo.create(review);

      const avgRating = await this.reviewRepo.findAverageRatingForUser(command.reviewedUserId);
      const totalReviews = await this.reviewRepo.countByReviewedUser(command.reviewedUserId);

      const updatedUser = new User(
        reviewedUser.id,
        reviewedUser.username,
        reviewedUser.email,
        reviewedUser.google_id,
        reviewedUser.phone,
        reviewedUser.password_hash,
        reviewedUser.full_name,
        reviewedUser.bio,
        reviewedUser.avatar_url,
        reviewedUser.lat,
        reviewedUser.lng,
        reviewedUser.country,
        reviewedUser.city,
        avgRating ?? reviewedUser.reputation_score,
        totalReviews,
        reviewedUser.is_verified,
        reviewedUser.is_active,
        reviewedUser.created_at,
        reviewedUser.role,
        reviewedUser.refresh_token,
      );

      await this.userRepo.update(updatedUser);

      return result;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to create review");
    }
  }
}
