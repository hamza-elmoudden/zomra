import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { SendMessageHandler } from 'src/messaging/application/commands/handler/send-message.handler';
import { ID_CONVERSATION_REPOSITORY, ConversationRepository } from 'src/messaging/domain/repositories/conversation.repository';
import { ID_MESSAGE_REPOSITORY, MessageRepository } from 'src/messaging/domain/repositories/message.repository';
import { Conversation } from 'src/messaging/domain/entities/conversation.entity';
import { Message } from 'src/messaging/domain/entities/message.entity';
import { SendMessageImpl } from 'src/messaging/application/commands/impl/send-message.impl';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-msg-uuid'),
}));

describe('SendMessageHandler', () => {
  let handler: SendMessageHandler;
  let convRepo: jest.Mocked<ConversationRepository>;
  let msgRepo: jest.Mocked<MessageRepository>;

  beforeEach(async () => {
    convRepo = { findById: jest.fn(), updateLastMessageAt: jest.fn() } as any;
    msgRepo = { create: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMessageHandler,
        { provide: ID_CONVERSATION_REPOSITORY, useValue: convRepo },
        { provide: ID_MESSAGE_REPOSITORY, useValue: msgRepo },
      ],
    }).compile();

    handler = module.get<SendMessageHandler>(SendMessageHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send a message successfully', async () => {
    const conversation = new Conversation('conv-1', 'user-a', 'user-b');
    convRepo.findById.mockResolvedValue(conversation);
    msgRepo.create.mockResolvedValue(
      new Message('generated-msg-uuid', 'conv-1', 'user-a', 'Hello!', false, false, new Date()),
    );

    const result = await handler.execute(new SendMessageImpl('user-a', 'conv-1', 'Hello!'));

    expect(convRepo.findById).toHaveBeenCalledWith('conv-1');
    expect(msgRepo.create).toHaveBeenCalled();
    expect(convRepo.updateLastMessageAt).toHaveBeenCalledWith('conv-1', expect.any(Date));
    expect(result).toBeDefined();
  });

  it('should throw BadRequestException for empty content', async () => {
    await expect(
      handler.execute(new SendMessageImpl('user-a', 'conv-1', '')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for whitespace-only content', async () => {
    await expect(
      handler.execute(new SendMessageImpl('user-a', 'conv-1', '   ')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if conversation does not exist', async () => {
    convRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new SendMessageImpl('user-a', 'bad-conv', 'Hello')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if sender is not a participant', async () => {
    const conversation = new Conversation('conv-1', 'user-a', 'user-b');
    convRepo.findById.mockResolvedValue(conversation);

    await expect(
      handler.execute(new SendMessageImpl('user-c', 'conv-1', 'Hello')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    convRepo.findById.mockResolvedValue(new Conversation('conv-1', 'user-a', 'user-b'));
    msgRepo.create.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new SendMessageImpl('user-a', 'conv-1', 'Hello')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
