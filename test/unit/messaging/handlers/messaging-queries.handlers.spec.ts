import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetConversationsHandler } from 'src/messaging/application/queries/handler/get-conversations.handler';
import { GetMessagesHandler } from 'src/messaging/application/queries/handler/get-messages.handler';
import { GetGroupMessagesHandler } from 'src/messaging/application/queries/handler/get-group-messages.handler';
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from 'src/messaging/domain/repositories/conversation.repository';
import { ID_MESSAGE_REPOSITORY, MessageRepository } from 'src/messaging/domain/repositories/message.repository';
import { ID_GROUP_MESSAGE_REPOSITORY, GroupMessageRepository } from 'src/messaging/domain/repositories/group-message.repository';
import { Conversation } from 'src/messaging/domain/entities/conversation.entity';
import { GetConversationsImpl } from 'src/messaging/application/queries/impl/get-conversations.impl';
import { GetMessagesImpl } from 'src/messaging/application/queries/impl/get-messages.impl';
import { GetGroupMessagesImpl } from 'src/messaging/application/queries/impl/get-group-messages.impl';

describe('GetConversationsHandler', () => {
  let handler: GetConversationsHandler;
  let repo: jest.Mocked<ConversationRepository>;

  beforeEach(async () => {
    repo = { findByUserId: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetConversationsHandler,
        { provide: ID_CONVERSATION_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetConversationsHandler>(GetConversationsHandler);
  });

  it('should return conversations for a user', async () => {
    const expected = [new Conversation('c1', 'u1', 'u2')];
    repo.findByUserId.mockResolvedValue(expected);

    const result = await handler.execute(new GetConversationsImpl('user-1'));
    expect(repo.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });
});

describe('GetMessagesHandler', () => {
  let handler: GetMessagesHandler;
  let msgRepo: jest.Mocked<MessageRepository>;
  let convRepo: jest.Mocked<ConversationRepository>;

  beforeEach(async () => {
    msgRepo = { findByConversationId: jest.fn() } as any;
    convRepo = { findById: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMessagesHandler,
        { provide: ID_MESSAGE_REPOSITORY, useValue: msgRepo },
        { provide: ID_CONVERSATION_REPOSITORY, useValue: convRepo },
      ],
    }).compile();

    handler = module.get<GetMessagesHandler>(GetMessagesHandler);
  });

  it('should return messages for a conversation', async () => {
    convRepo.findById.mockResolvedValue(new Conversation('conv-1', 'u1', 'u2'));
    msgRepo.findByConversationId.mockResolvedValue([]);

    const result = await handler.execute(new GetMessagesImpl('conv-1'));
    expect(convRepo.findById).toHaveBeenCalledWith('conv-1');
    expect(msgRepo.findByConversationId).toHaveBeenCalledWith('conv-1');
    expect(result).toEqual([]);
  });

  it('should throw NotFoundException if conversation does not exist', async () => {
    convRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMessagesImpl('bad-conv')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('GetGroupMessagesHandler', () => {
  let handler: GetGroupMessagesHandler;
  let repo: jest.Mocked<GroupMessageRepository>;

  beforeEach(async () => {
    repo = { findByEventId: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetGroupMessagesHandler,
        { provide: ID_GROUP_MESSAGE_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetGroupMessagesHandler>(GetGroupMessagesHandler);
  });

  it('should return group messages for an event', async () => {
    repo.findByEventId.mockResolvedValue([]);

    const result = await handler.execute(new GetGroupMessagesImpl('event-1'));
    expect(repo.findByEventId).toHaveBeenCalledWith('event-1');
    expect(result).toEqual([]);
  });
});
