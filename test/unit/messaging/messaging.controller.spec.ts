import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MessagingController } from 'src/messaging/api/messaging.controller';
import { Conversation } from 'src/messaging/domain/entities/conversation.entity';
import { User } from 'src/users/domain/entities/user.entity';
import { CreateConversationImpl } from 'src/messaging/application/commands/impl/create-conversation.impl';
import { GetConversationsImpl } from 'src/messaging/application/queries/impl/get-conversations.impl';
import { GetMessagesImpl } from 'src/messaging/application/queries/impl/get-messages.impl';
import { SendMessageImpl } from 'src/messaging/application/commands/impl/send-message.impl';
import { DeleteMessageImpl } from 'src/messaging/application/commands/impl/delete-message.impl';
import { GetGroupMessagesImpl } from 'src/messaging/application/queries/impl/get-group-messages.impl';
import { SendGroupMessageImpl } from 'src/messaging/application/commands/impl/send-group-message.impl';

describe('MessagingController', () => {
  let controller: MessagingController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<MessagingController>(MessagingController);
  });

  const mockUser = { id: 'user-a' } as User;

  describe('createConversation', () => {
    it('should execute CreateConversationImpl', async () => {
      const expected = new Conversation('c1', 'other-user', 'user-a', 'event-1');
      commandBus.execute.mockResolvedValue(expected);

      const dto = { recipientId: 'other-user', eventId: 'event-1' };
      const result = await controller.createConversation(dto, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(new CreateConversationImpl('user-a', 'other-user', 'event-1'));
      expect(result).toEqual(expected);
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
      expect(queryBus.execute).toHaveBeenCalledWith(new GetMessagesImpl('conv-1', 'user-a'));
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

      await controller.getGroupMessages('event-1', mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetGroupMessagesImpl('event-1', 'user-a'));
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
