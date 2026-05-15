import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { JoinEventHandler } from 'src/events/application/commands/handler/join-event.handler';
import { LeaveEventHandler } from 'src/events/application/commands/handler/leave-event.handler';
import { AcceptParticipantHandler } from 'src/events/application/commands/handler/accept-participant.handler';
import { RejectParticipantHandler } from 'src/events/application/commands/handler/reject-participant.handler';
import { EVENTS_KAY } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY } from 'src/events/domain/repositories/event-participant.repository';
import { EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { Events } from 'src/events/domain/entities/events.entities';
import { EventParticipant } from 'src/events/domain/entities/event-participant.entity';
import { JoinEventImpl } from 'src/events/application/commands/impl/join-event.impl';
import { LeaveEventImpl } from 'src/events/application/commands/impl/leave-event.impl';
import { AcceptParticipantImpl } from 'src/events/application/commands/impl/accept-participant.impl';
import { RejectParticipantImpl } from 'src/events/application/commands/impl/reject-participant.impl';

function createMockEvent(id: string, hostId: string, overrides?: Partial<Events>): Events {
  return new Events(
    id, hostId,
    overrides?.title ?? 'Event',
    overrides?.category ?? 'sports',
    overrides?.starts_at ?? new Date(),
    overrides?.duration_minutes ?? 60,
    overrides?.max_participants ?? 10,
    overrides?.current_count ?? 1,
    (overrides?.status as any) ?? 'open',
    overrides?.is_public ?? true,
  );
}

function createMockParticipant(id: string, eventId: string, userId: string, status: string = 'pending'): EventParticipant {
  return new EventParticipant(id, eventId, userId, status as any, new Date());
}

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'generated-participant-uuid'),
}));

describe('JoinEventHandler', () => {
  let handler: JoinEventHandler;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    eventRepo = { findById: jest.fn(), update: jest.fn() } as any;
    participantRepo = {
      findByEventAndUser: jest.fn(),
      countByEventId: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JoinEventHandler,
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<JoinEventHandler>(JoinEventHandler);
  });

  it('should allow a user to join an open event', async () => {
    const event = createMockEvent('event-1', 'host-1', { status: 'open' });
    eventRepo.findById.mockResolvedValue(event);
    participantRepo.findByEventAndUser.mockResolvedValue(null);
    participantRepo.countByEventId.mockResolvedValue(5);
    participantRepo.create.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-1'),
    );

    const result = await handler.execute(new JoinEventImpl('event-1', 'user-1'));

    expect(participantRepo.create).toHaveBeenCalled();
    expect(eventRepo.update).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw NotFoundException if event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new JoinEventImpl('bad-id', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if event is not open', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { status: 'cancelled' }),
    );

    await expect(
      handler.execute(new JoinEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException if user is the host', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { status: 'open' }),
    );

    await expect(
      handler.execute(new JoinEventImpl('event-1', 'host-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException if already a participant', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { status: 'open' }),
    );
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-1'),
    );

    await expect(
      handler.execute(new JoinEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw BadRequestException if event is full', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { status: 'open', max_participants: 10 }),
    );
    participantRepo.findByEventAndUser.mockResolvedValue(null);
    participantRepo.countByEventId.mockResolvedValue(10);

    await expect(
      handler.execute(new JoinEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { status: 'open' }),
    );
    participantRepo.findByEventAndUser.mockResolvedValue(null);
    participantRepo.countByEventId.mockResolvedValue(1);
    participantRepo.create.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new JoinEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('LeaveEventHandler', () => {
  let handler: LeaveEventHandler;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    eventRepo = { findById: jest.fn(), update: jest.fn() } as any;
    participantRepo = {
      findByEventAndUser: jest.fn(),
      delete: jest.fn(),
      countByEventId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveEventHandler,
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<LeaveEventHandler>(LeaveEventHandler);
  });

  it('should allow a participant to leave', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-1'),
    );
    participantRepo.countByEventId.mockResolvedValue(1);

    await handler.execute(new LeaveEventImpl('event-1', 'user-1'));
    expect(participantRepo.delete).toHaveBeenCalledWith('p1');
    expect(eventRepo.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException if event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new LeaveEventImpl('bad-id', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if user is not a participant', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(null);

    await expect(
      handler.execute(new LeaveEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-1'),
    );
    participantRepo.delete.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new LeaveEventImpl('event-1', 'user-1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('AcceptParticipantHandler', () => {
  let handler: AcceptParticipantHandler;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    eventRepo = { findById: jest.fn() } as any;
    participantRepo = {
      findByEventAndUser: jest.fn(),
      countByEventId: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptParticipantHandler,
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<AcceptParticipantHandler>(AcceptParticipantHandler);
  });

  it('should accept a pending participant', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-2', 'pending'),
    );
    participantRepo.countByEventId.mockResolvedValue(5);
    participantRepo.updateStatus.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-2', 'accepted'),
    );

    const result = await handler.execute(new AcceptParticipantImpl('event-1', 'user-2', 'host-1'));
    expect(participantRepo.updateStatus).toHaveBeenCalledWith('p1', 'accepted');
    expect(result).toBeDefined();
  });

  it('should throw ForbiddenException if not the host', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));

    await expect(
      handler.execute(new AcceptParticipantImpl('event-1', 'user-2', 'other-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if event is full', async () => {
    eventRepo.findById.mockResolvedValue(
      createMockEvent('event-1', 'host-1', { max_participants: 10 }),
    );
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-2', 'pending'),
    );
    participantRepo.countByEventId.mockResolvedValue(10);

    await expect(
      handler.execute(new AcceptParticipantImpl('event-1', 'user-2', 'host-1')),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('RejectParticipantHandler', () => {
  let handler: RejectParticipantHandler;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    eventRepo = { findById: jest.fn() } as any;
    participantRepo = {
      findByEventAndUser: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectParticipantHandler,
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<RejectParticipantHandler>(RejectParticipantHandler);
  });

  it('should reject a pending participant', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-2', 'pending'),
    );
    participantRepo.updateStatus.mockResolvedValue(
      createMockParticipant('p1', 'event-1', 'user-2', 'rejected'),
    );

    const result = await handler.execute(new RejectParticipantImpl('event-1', 'user-2', 'host-1'));
    expect(participantRepo.updateStatus).toHaveBeenCalledWith('p1', 'rejected');
    expect(result).toBeDefined();
  });

  it('should throw ForbiddenException if not the host', async () => {
    eventRepo.findById.mockResolvedValue(createMockEvent('event-1', 'host-1'));

    await expect(
      handler.execute(new RejectParticipantImpl('event-1', 'user-2', 'other-user')),
    ).rejects.toThrow(ForbiddenException);
  });
});
