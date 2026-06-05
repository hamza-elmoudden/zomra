import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { UpdateEventHandler } from 'src/events/application/commands/handler/update-event.handler';
import { DeleteEventHandler } from 'src/events/application/commands/handler/delete-event.handler';
import { GetEventByIdHandler } from 'src/events/application/queries/handler/get-event-by-id.handler';
import { ListEventsHandler } from 'src/events/application/queries/handler/list-events.handler';
import { GetNearbyEventsHandler } from 'src/events/application/queries/handler/get-nearby-events.handler';
import { GetEventParticipantsHandler } from 'src/events/application/queries/handler/get-event-participants.handler';
import { GetMyEventsHandler } from 'src/events/application/queries/handler/get-my-events.handler';
import { EVENTS_KAY } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY } from 'src/events/domain/repositories/event-participant.repository';
import { EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { Events } from 'src/events/domain/entities/events.entities';
import { UpdateEventImpl } from 'src/events/application/commands/impl/update-event.impl';
import { DeleteEventImpl } from 'src/events/application/commands/impl/delete-event.impl';
import { GetEventByIdImpl } from 'src/events/application/queries/impl/get-event-by-id.impl';
import { ListEventsImpl } from 'src/events/application/queries/impl/list-events.impl';
import { GetNearbyEventsImpl } from 'src/events/application/queries/impl/get-nearby-events.impl';
import { GetEventParticipantsImpl } from 'src/events/application/queries/impl/get-event-participants.impl';
import { GetMyEventsImpl } from 'src/events/application/queries/impl/get-my-events.impl';

function createMockEvent(id: string, hostId: string): Events {
  return new Events(
    id, hostId, 'Event', 'sports', new Date(),
    60, 10, 1, 'open' as any, true,
    undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined,
  );
}

describe('UpdateEventHandler', () => {
  let handler: UpdateEventHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findById: jest.fn(), update: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEventHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<UpdateEventHandler>(UpdateEventHandler);
  });

  it('should update an existing event', async () => {
    const event = createMockEvent('event-1', 'host-1');
    repo.findById.mockResolvedValue(event);
    repo.update.mockResolvedValue({ ...event, title: 'Updated' });

    const command = new UpdateEventImpl('event-1', 'Updated');
    const result = await handler.execute(command);

    expect(repo.findById).toHaveBeenCalledWith('event-1');
    expect(repo.update).toHaveBeenCalledWith('event-1', command);
    expect(result.title).toBe('Updated');
  });

  it('should throw NotFoundException if event does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateEventImpl('bad-id')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    repo.findById.mockResolvedValue(createMockEvent('e1', 'h1'));
    repo.update.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new UpdateEventImpl('e1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('DeleteEventHandler', () => {
  let handler: DeleteEventHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findById: jest.fn(), delete: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteEventHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<DeleteEventHandler>(DeleteEventHandler);
  });

  it('should delete event if user is the host', async () => {
    repo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    repo.delete.mockResolvedValue(undefined);

    await handler.execute(new DeleteEventImpl('event-1', 'host-1'));
    expect(repo.delete).toHaveBeenCalledWith('event-1');
  });

  it('should throw NotFoundException if event does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteEventImpl('bad-id', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not the host', async () => {
    repo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));

    await expect(
      handler.execute(new DeleteEventImpl('event-1', 'other-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    repo.findById.mockResolvedValue(createMockEvent('e1', 'h1'));
    repo.delete.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new DeleteEventImpl('e1', 'h1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('GetEventByIdHandler', () => {
  let handler: GetEventByIdHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findById: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventByIdHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetEventByIdHandler>(GetEventByIdHandler);
  });

  it('should return event by id', async () => {
    const event = createMockEvent('e1', 'h1');
    repo.findById.mockResolvedValue(event);

    const result = await handler.execute(new GetEventByIdImpl('e1'));
    expect(result).toEqual(event);
  });

  it('should throw NotFoundException if not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetEventByIdImpl('bad-id')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ListEventsHandler', () => {
  let handler: ListEventsHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findAll: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListEventsHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<ListEventsHandler>(ListEventsHandler);
  });

  it('should list events with filters', async () => {
    repo.findAll.mockResolvedValue([]);

    const query = new ListEventsImpl('Casablanca', 'sports', 'open', 1, 10);
    await handler.execute(query);

    expect(repo.findAll).toHaveBeenCalledWith({
      city: 'Casablanca',
      category: 'sports',
      status: 'open',
      page: 1,
      limit: 10,
    });
  });
});

describe('GetNearbyEventsHandler', () => {
  let handler: GetNearbyEventsHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findNearby: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetNearbyEventsHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetNearbyEventsHandler>(GetNearbyEventsHandler);
  });

  it('should find nearby events', async () => {
    repo.findNearby.mockResolvedValue([]);

    await handler.execute(new GetNearbyEventsImpl(33.5, -7.5, 50));
    expect(repo.findNearby).toHaveBeenCalledWith(33.5, -7.5, 50);
  });
});

describe('GetEventParticipantsHandler', () => {
  let handler: GetEventParticipantsHandler;
  let repo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    repo = { findByEventId: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventParticipantsHandler,
        { provide: EVENT_PARTICIPANT_KEY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetEventParticipantsHandler>(GetEventParticipantsHandler);
  });

  it('should return participants for an event', async () => {
    repo.findByEventId.mockResolvedValue([]);

    await handler.execute(new GetEventParticipantsImpl('event-1'));
    expect(repo.findByEventId).toHaveBeenCalledWith('event-1');
  });
});

describe('GetMyEventsHandler', () => {
  let handler: GetMyEventsHandler;
  let repo: jest.Mocked<EventsRepositories>;

  beforeEach(async () => {
    repo = { findByUser: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyEventsHandler,
        { provide: EVENTS_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetMyEventsHandler>(GetMyEventsHandler);
  });

  it('should return events for the given user', async () => {
    const events = [createMockEvent('e1', 'user-1'), createMockEvent('e2', 'user-1')];
    repo.findByUser.mockResolvedValue(events);

    const result = await handler.execute(new GetMyEventsImpl('user-1'));
    expect(repo.findByUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(events);
  });

  it('should return empty array when user has no events', async () => {
    repo.findByUser.mockResolvedValue([]);

    const result = await handler.execute(new GetMyEventsImpl('user-2'));
    expect(result).toEqual([]);
  });
});
