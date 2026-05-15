import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MessagingController } from 'src/messaging/api/messaging.controller';
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from 'src/messaging/domain/repositories/conversation.repository';
import { Conversation } from 'src/messaging/domain/entities/conversation.entity';
import { User } from 'src/users/domain/entities/user.entity';
import { GetConversationsImpl } from 'src/messaging/application/queries/impl/get-conversations.impl';
import { GetMessagesImpl } from 'src/messaging/application/queries/impl/get-messages.impl';
import { SendMessageImpl } from 'src/messaging/application/commands/impl/send-message.impl';
import { DeleteMessageImpl } from 'src/messaging/application/commands/impl/delete-message.impl';
import { GetGroupMessagesImpl } from 'src/messaging/application/queries/impl/get-group-messages.impl';
import { SendGroupMessageImpl } from 'src/messaging/application/commands/impl/send-group-message.impl';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-conv-uuid'),
}));

describe('MessagingController', () => {
  let controller: MessagingController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let convRepo: jest.Mocked<ConversationRepository>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;
    convRepo = {
      findByUsers: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: ID_CONVERSATION_REPOSITORY, useValue: convRepo },
      ],
    }).compile();

    controller = module.get<MessagingController>(MessagingController);
  });

  const mockUser = { id: 'user-a' } as User;

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      convRepo.findByUsers.mockResolvedValue(null);
      const expectedConv = new Conversation('generated-conv-uuid', 'other-user', 'user-a', 'event-1');
      convRepo.create.mockResolvedValue(expectedConv);

      const dto = { recipientId: 'other-user', eventId: 'event-1' };
      const result = await controller.createConversation(dto, mockUser);

      expect(convRepo.findByUsers).toHaveBeenCalledWith('other-user', 'user-a');
      expect(convRepo.create).toHaveBeenCalled();
      expect(result).toEqual(expectedConv);
    });

    it('should return existing conversation if one exists', async () => {
      const existing = new Conversation('existing-id', 'other-user', 'user-a', 'event-1');
      convRepo.findByUsers.mockResolvedValue(existing);

      const dto = { recipientId: 'other-user', eventId: 'event-1' };
      const result = await controller.createConversation(dto, mockUser);

      expect(convRepo.findByUsers).toHaveBeenCalled();
      expect(convRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('should normalize user IDs (user-a < other-user)', async () => {
      convRepo.findByUsers.mockResolvedValue(null);
      convRepo.create.mockResolvedValue(new Conversation('id', 'other-user', 'user-a'));

      const dto = { recipientId: 'other-user' };
      await controller.createConversation(dto, mockUser);

      expect(convRepo.findByUsers).toHaveBeenCalledWith('other-user', 'user-a');
    });
  });

  describe('getConversations', () => {
    it('should execute GetConversationsImpl', async () => {
      const expected = [new Conversation('c1', 'u1', 'u2')];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getConversations(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetConversationsImpl('user-a'));
      expect(result).toEqual(expected);
    });
  });

  describe('getMessages', () => {
    it('should execute GetMessagesImpl', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.getMessages('conv-1', mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetMessagesImpl('conv-1'));
    });
  });

  describe('sendMessage', () => {
    it('should execute SendMessageImpl', async () => {
      const dto = { content: 'Hello!' };
      const expected = { id: 'msg-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.sendMessage('conv-1', dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new SendMessageImpl('user-a', 'conv-1', 'Hello!'));
      expect(result).toEqual(expected);
    });
  });

  describe('deleteMessage', () => {
    it('should execute DeleteMessageImpl', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.deleteMessage('msg-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new DeleteMessageImpl('msg-1', 'user-a'));
    });
  });

  describe('getGroupMessages', () => {
    it('should execute GetGroupMessagesImpl', async () => {
      queryBus.execute.mockResolvedValue([]);

      await controller.getGroupMessages('event-1');
      expect(queryBus.execute).toHaveBeenCalledWith(new GetGroupMessagesImpl('event-1'));
    });
  });

  describe('sendGroupMessage', () => {
    it('should execute SendGroupMessageImpl', async () => {
      const dto = { content: 'Hey group!' };
      const expected = { id: 'gm-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.sendGroupMessage('event-1', dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new SendGroupMessageImpl('user-a', 'event-1', 'Hey group!'));
      expect(result).toEqual(expected);
    });
  });
});
