import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { EventsModule } from 'src/events/events.module';
import { ID_REVIEW_REPOSITORY } from './domain/repositories/review.repository';
import { ReviewInfrastructure } from './infrastructure/review.infrastructure';
import { CreateReviewHandler } from './application/commands/handler/create-review.handler';
import { GetUserReviewsHandler } from './application/queries/handler/get-user-reviews.handler';
import { ReviewsController } from './api/reviews.controller';

@Module({
  imports: [PrismaModule, CqrsModule, UsersModule, EventsModule],
  controllers: [ReviewsController],
  providers: [
    {
      provide: ID_REVIEW_REPOSITORY,
      useClass: ReviewInfrastructure,
    },
    CreateReviewHandler,
    GetUserReviewsHandler,
  ],
})
export class ReviewsModule {}
