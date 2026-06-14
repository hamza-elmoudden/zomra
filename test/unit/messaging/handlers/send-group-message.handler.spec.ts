import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { SendGroupMessageHandler } from 'src/messaging/application/commands/handler/send-group-message.handler';
import { ID_GROUP_MESSAGE_REPOSITORY, GroupMessageRepository } from 'src/messaging/domain/repositories/group-message.repository';
import { EVENTS_KAY, EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { Events } from 'src/events/domain/entities/events.entities';
import { EventParticipant } from 'src/events/domain/entities/event-participant.entity';
import { GroupMessage } from 'src/messaging/domain/entities/group-message.entity';
import { SendGroupMessageImpl } from 'src/messaging/application/commands/impl/send-group-message.impl';
import { MessagingGateway } from 'src/messaging/gateway/messaging.gateway';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-gm-uuid'),
}));

function mockEvent(id: string, hostId: string): Events {
  return new Events(id, hostId, 'Event', 'sports', new Date(), 60, 10, 1, 'open' as any, true);
}

function mockParticipant(eventId: string, userId: string, status: string): EventParticipant {
  return new EventParticipant('p1', eventId, userId, status as any, new Date());
}

describe('SendGroupMessageHandler', () => {
  let handler: SendGroupMessageHandler;
  let groupMsgRepo: jest.Mocked<GroupMessageRepository>;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;

  beforeEach(async () => {
    groupMsgRepo = { create: jest.fn() } as any;
    eventRepo = { findById: jest.fn() } as any;
    participantRepo = { findByEventAndUser: jest.fn() } as any;
    const messagingGateway = { sendNewMessage: jest.fn(), sendMessageDeleted: jest.fn(), sendNewGroupMessage: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendGroupMessageHandler,
        { provide: ID_GROUP_MESSAGE_REPOSITORY, useValue: groupMsgRepo },
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
        { provide: MessagingGateway, useValue: messagingGateway },
      ],
    }).compile();

    handler = module.get<SendGroupMessageHandler>(SendGroupMessageHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send a group message as accepted participant', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(mockParticipant('event-1', 'user-1', 'accepted'));
    groupMsgRepo.create.mockResolvedValue(
      new GroupMessage('gm-1', 'event-1', 'user-1', 'Hello group!', false, new Date()),
    );

    const result = await handler.execute(new SendGroupMessageImpl('user-1', 'event-1', 'Hello group!'));
    expect(groupMsgRepo.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw BadRequestException for empty content', async () => {
    await expect(
      handler.execute(new SendGroupMessageImpl('user-1', 'event-1', '')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if event not found', async () => {
    eventRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new SendGroupMessageImpl('user-1', 'bad-event', 'Hello')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not an accepted participant', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(null);

    await expect(
      handler.execute(new SendGroupMessageImpl('user-1', 'event-1', 'Hello')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if participant status is not accepted', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(mockParticipant('event-1', 'user-1', 'pending'));

    await expect(
      handler.execute(new SendGroupMessageImpl('user-1', 'event-1', 'Hello')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    eventRepo.findById.mockResolvedValue(mockEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(mockParticipant('event-1', 'user-1', 'accepted'));
    groupMsgRepo.create.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new SendGroupMessageImpl('user-1', 'event-1', 'Hello')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
