import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateEventsHandler } from 'src/events/application/commands/handler/create.events.handler';
import { EVENTS_KAY } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { Events } from 'src/events/domain/entities/events.entities';
import { CreateEventsImpl } from 'src/events/application/commands/impl/create.events.impl';

describe('CreateEventsHandler', () => {
  let handler: CreateEventsHandler;
  let repo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
    } as any;
    participantRepo = {
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEventsHandler,
        { provide: EVENTS_KAY, useValue: repo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
      ],
    }).compile();

    handler = module.get<CreateEventsHandler>(CreateEventsHandler);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create an event successfully and add host as participant', async () => {
    const command = new CreateEventsImpl(
      'host-1', 'Test Event', 'sports', new Date('2025-06-01'),
      60, 20, 1, 'Description', '123 Street', 'Casablanca',
      33.5, -7.5,
    );

    const expectedEvent = new Events(
      'generated-uuid', 'host-1', 'Test Event', 'sports', new Date('2025-06-01'),
      60, 20, 1, 'open', true, 'Description', '123 Street', 'Casablanca',
      undefined, undefined, undefined, 33.5, -7.5,
    );

    repo.create.mockResolvedValue(expectedEvent);
    participantRepo.create.mockResolvedValue({} as any);

    const result = await handler.execute(command);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      host_id: 'host-1',
      title: 'Test Event',
      status: 'open',
      is_public: true,
    }));
    expect(participantRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      event_id: 'generated-uuid',
      user_id: 'host-1',
      status: 'accepted',
    }));
    expect(result).toEqual(expectedEvent);
  });

  it('should handle repo errors', async () => {
    const command = new CreateEventsImpl(
      'host-1', 'Test', 'sports', new Date(), 60, 10, 1,
    );

    repo.create.mockRejectedValue(new Error('DB error'));

    await expect(handler.execute(command)).rejects.toThrow(InternalServerErrorException);
  });
});
