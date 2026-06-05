import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus, CqrsModule } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { EventsController } from 'src/events/api/events.controller';
import { CreateEventsImpl } from 'src/events/application/commands/impl/create.events.impl';
import { UpdateEventImpl } from 'src/events/application/commands/impl/update-event.impl';
import { DeleteEventImpl } from 'src/events/application/commands/impl/delete-event.impl';
import { JoinEventImpl } from 'src/events/application/commands/impl/join-event.impl';
import { LeaveEventImpl } from 'src/events/application/commands/impl/leave-event.impl';
import { AcceptParticipantImpl } from 'src/events/application/commands/impl/accept-participant.impl';
import { RejectParticipantImpl } from 'src/events/application/commands/impl/reject-participant.impl';
import { GetEventByIdImpl } from 'src/events/application/queries/impl/get-event-by-id.impl';
import { ListEventsImpl } from 'src/events/application/queries/impl/list-events.impl';
import { GetNearbyEventsImpl } from 'src/events/application/queries/impl/get-nearby-events.impl';
import { GetEventParticipantsImpl } from 'src/events/application/queries/impl/get-event-participants.impl';
import { GetMyEventsImpl } from 'src/events/application/queries/impl/get-my-events.impl';
import { User } from 'src/users/domain/entities/user.entity';

describe('EventsController', () => {
  let controller: EventsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('create', () => {
    it('should execute CreateEventsImpl with correct data', async () => {
      const dto = {
        title: 'Test Event',
        category: 'sports',
        startsAt: '2025-06-01T10:00:00Z',
        durationMinutes: 60,
        maxParticipants: 20,
        description: 'A test event',
        address: '123 Street',
        city: 'Casablanca',
        lat: 33.5,
        lng: -7.5,
      };
      const expected = { id: 'event-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          host_id: 'user-1',
          title: 'Test Event',
          category: 'sports',
        }),
      );
      expect(result).toEqual(expected);
    });

    it('should use defaults for optional fields', async () => {
      const dto = {
        title: 'Minimal Event',
        category: 'music',
        startsAt: '2025-06-01T10:00:00Z',
      };
      commandBus.execute.mockResolvedValue({ id: 'event-2' });

      await controller.create(dto, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_minutes: 60,
          max_participants: 10,
          current_count: 1,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should execute GetEventByIdImpl', async () => {
      const expected = { id: 'event-1' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.findById('event-1');
      expect(queryBus.execute).toHaveBeenCalledWith(new GetEventByIdImpl('event-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should execute ListEventsImpl with query params', async () => {
      const query = { city: 'Casablanca', category: 'sports', status: 'open' as const, page: 1, limit: 10 };
      queryBus.execute.mockResolvedValue([]);

      await controller.findAll(query);
      expect(queryBus.execute).toHaveBeenCalledWith(
        new ListEventsImpl('Casablanca', 'sports', 'open', 1, 10),
      );
    });

    it('should handle empty query', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.findAll({});
      expect(queryBus.execute).toHaveBeenCalledWith(
        new ListEventsImpl(undefined, undefined, undefined, undefined, undefined),
      );
    });
  });

  describe('findNearby', () => {
    it('should execute GetNearbyEventsImpl', async () => {
      const query = { lat: 33.5, lng: -7.5, radiusKm: 50 };
      queryBus.execute.mockResolvedValue([]);

      await controller.findNearby(query);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetNearbyEventsImpl(33.5, -7.5, 50));
    });
  });

  describe('update', () => {
    it('should update if user is the host', async () => {
      const dto = { title: 'Updated Title' };
      queryBus.execute.mockResolvedValue({ host_id: 'user-1' });
      commandBus.execute.mockResolvedValue({ id: 'event-1' });

      const result = await controller.update('event-1', dto, mockUser);
      expect(result).toEqual({ id: 'event-1' });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'event-1', title: 'Updated Title' }),
      );
    });

    it('should throw ForbiddenException if user is not the host', async () => {
      queryBus.execute.mockResolvedValue({ host_id: 'user-2' });

      await expect(
        controller.update('event-1', { title: 'Hacked' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should execute DeleteEventImpl', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.delete('event-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new DeleteEventImpl('event-1', 'user-1'));
    });
  });

  describe('join', () => {
    it('should execute JoinEventImpl', async () => {
      const expected = { id: 'participant-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.join('event-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new JoinEventImpl('event-1', 'user-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('leave', () => {
    it('should execute LeaveEventImpl', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.leave('event-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new LeaveEventImpl('event-1', 'user-1'));
    });
  });

  describe('getParticipants', () => {
    it('should execute GetEventParticipantsImpl', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.getParticipants('event-1');
      expect(queryBus.execute).toHaveBeenCalledWith(new GetEventParticipantsImpl('event-1'));
    });
  });

  describe('manageParticipant', () => {
    it('should execute AcceptParticipantImpl when action is accept', async () => {
      commandBus.execute.mockResolvedValue({ id: 'p1' });

      const result = await controller.manageParticipant('event-1', 'user-2', mockUser, 'accept');
      expect(commandBus.execute).toHaveBeenCalledWith(
        new AcceptParticipantImpl('event-1', 'user-2', 'user-1'),
      );
      expect(result).toEqual({ id: 'p1' });
    });

    it('should execute RejectParticipantImpl when action is reject', async () => {
      commandBus.execute.mockResolvedValue({ id: 'p1' });

      const result = await controller.manageParticipant('event-1', 'user-2', mockUser, 'reject');
      expect(commandBus.execute).toHaveBeenCalledWith(
        new RejectParticipantImpl('event-1', 'user-2', 'user-1'),
      );
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('myEvents', () => {
    it('should execute GetMyEventsImpl', async () => {
      const expected = [{ id: 'e1' }, { id: 'e2' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.myEvents(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetMyEventsImpl('user-1'));
      expect(result).toEqual(expected);
    });
  });
});
