import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { Review } from "../domain/entities/review.entity";
import { CreateReviewDto } from "./dto/create-review.dto";
import { CreateReviewImpl } from "../application/commands/impl/create-review.impl";
import { GetUserReviewsImpl } from "../application/queries/impl/get-user-reviews.impl";

@Controller()
export class ReviewsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: User): Promise<Review> {
    return this.commandBus.execute(
      new CreateReviewImpl(user.id, dto.reviewedUserId, dto.eventId, dto.rating, dto.comment),
    );
  }

  @Get('users/:userId/reviews')
  async getByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<Review[]> {
    return this.queryBus.execute(new GetUserReviewsImpl(userId));
  }
}
