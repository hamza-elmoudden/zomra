import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { UserInterests } from "../domain/entities/user.entities";
import { AddInterestDto } from "./dto/add-interest.dto";
import { AddUserInterestImpl } from "../application/commands/impl/add-user-interest.impl";
import { RemoveUserInterestImpl } from "../application/commands/impl/remove-user-interest.impl";
import { GetUserInterestsImpl } from "../application/queries/impl/get-user-interests.impl";
import { GetOneUserInterestImpl } from "../application/queries/impl/get-one-user-interest.impl";

@Controller('user-interests')
@UseGuards(JwtAuthGuard)
export class UserInterestsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(@CurrentUser() user: User): Promise<UserInterests[]> {
    return this.queryBus.execute(new GetUserInterestsImpl(user.id))
  }

  @Get(':interestId')
  async getOne(
    @Param('interestId', ParseIntPipe) interestId: number,
    @CurrentUser() user: User,
  ): Promise<UserInterests> {
    return this.queryBus.execute(new GetOneUserInterestImpl(user.id, interestId))
  }

  @Post()
  async add(
    @Body() dto: AddInterestDto,
    @CurrentUser() user: User,
  ): Promise<UserInterests> {
    return this.commandBus.execute(new AddUserInterestImpl(user.id, dto.interestId))
  }

  @Delete(':interestId')
  async remove(
    @Param('interestId', ParseIntPipe) interestId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new RemoveUserInterestImpl(user.id, interestId))
  }
}
