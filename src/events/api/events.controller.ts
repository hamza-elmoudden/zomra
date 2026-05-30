import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe, ForbiddenException } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { ListEventsQueryDto } from "./dto/list-events-query.dto";
import { NearbyEventsQueryDto } from "./dto/nearby-events-query.dto";
import { CreateEventsImpl } from "../application/commands/impl/create.events.impl";
import { UpdateEventImpl } from "../application/commands/impl/update-event.impl";
import { DeleteEventImpl } from "../application/commands/impl/delete-event.impl";
import { JoinEventImpl } from "../application/commands/impl/join-event.impl";
import { LeaveEventImpl } from "../application/commands/impl/leave-event.impl";
import { AcceptParticipantImpl } from "../application/commands/impl/accept-participant.impl";
import { RejectParticipantImpl } from "../application/commands/impl/reject-participant.impl";
import { GetEventByIdImpl } from "../application/queries/impl/get-event-by-id.impl";
import { ListEventsImpl } from "../application/queries/impl/list-events.impl";
import { GetNearbyEventsImpl } from "../application/queries/impl/get-nearby-events.impl";
import { GetEventParticipantsImpl } from "../application/queries/impl/get-event-participants.impl";
import { Events } from "../domain/entities/events.entities";
import { EventParticipant } from "../domain/entities/event-participant.entity";

@Controller('events')
export class EventsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateEventDto, @CurrentUser() user: User): Promise<Events> {
    return this.commandBus.execute(
      new CreateEventsImpl(
        user.id,
        dto.title,
        dto.category,
        new Date(dto.startsAt),
        dto.durationMinutes ?? 60,
        dto.maxParticipants ?? 10,
        1,
        dto.description,
        dto.address,
        dto.city,
        dto.coverImageUrl,
        dto.lat,
        dto.lng,
      ),
    )
  }

  @Get()
  async findAll(@Query() query: ListEventsQueryDto): Promise<Events[]> {
    return this.queryBus.execute(
      new ListEventsImpl(query.city, query.category, query.status, query.page, query.limit),
    )
  }

  @Get('/nearby')
  async findNearby(@Query() query: NearbyEventsQueryDto): Promise<Events[]> {
    return this.queryBus.execute(
      new GetNearbyEventsImpl(query.lat, query.lng, query.radiusKm),
    )
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Events> {
    return this.queryBus.execute(new GetEventByIdImpl(id))
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: User,
  ): Promise<Events> {
    const existing = await this.queryBus.execute(new GetEventByIdImpl(id))

    if (existing.host_id !== user.id) {
      throw new ForbiddenException('Only the event host can update this event')
    }

    return this.commandBus.execute(
      new UpdateEventImpl(
        id,
        dto.title,
        dto.description,
        dto.category,
        dto.startsAt ? new Date(dto.startsAt) : undefined,
        dto.durationMinutes,
        dto.maxParticipants,
        dto.address,
        dto.city,
        dto.coverImageUrl,
        dto.lat,
        dto.lng,
        dto.status,
      ),
    )
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<void> {
    return this.commandBus.execute(new DeleteEventImpl(id, user.id))
  }

  @Post(':eventId/join')
  @UseGuards(JwtAuthGuard)
  async join(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: User,
  ): Promise<EventParticipant> {
    return this.commandBus.execute(new JoinEventImpl(eventId, user.id))
  }

  @Post(':eventId/leave')
  @UseGuards(JwtAuthGuard)
  async leave(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new LeaveEventImpl(eventId, user.id))
  }

  @Get(':eventId/participants')
  @UseGuards(JwtAuthGuard)
  async getParticipants(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventParticipant[]> {
    return this.queryBus.execute(new GetEventParticipantsImpl(eventId))
  }

  @Patch(':eventId/participants/:userId')
  @UseGuards(JwtAuthGuard)
  async manageParticipant(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
    @Body('action') action: 'accept' | 'reject',
  ): Promise<EventParticipant> {
    if (action === 'accept') {
      return this.commandBus.execute(new AcceptParticipantImpl(eventId, userId, user.id))
    }
    return this.commandBus.execute(new RejectParticipantImpl(eventId, userId, user.id))
  }
}
