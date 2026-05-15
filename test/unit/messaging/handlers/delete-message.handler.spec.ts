import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { DeleteMessageHandler } from 'src/messaging/application/commands/handler/delete-message.handler';
import { ID_MESSAGE_REPOSITORY, MessageRepository } from 'src/messaging/domain/repositories/message.repository';
import { Message } from 'src/messaging/domain/entities/message.entity';
import { DeleteMessageImpl } from 'src/messaging/application/commands/impl/delete-message.impl';

describe('DeleteMessageHandler', () => {
  let handler: DeleteMessageHandler;
  let msgRepo: jest.Mocked<MessageRepository>;

  beforeEach(async () => {
    msgRepo = { findById: jest.fn(), softDelete: jest.fn() } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteMessageHandler,
        { provide: ID_MESSAGE_REPOSITORY, useValue: msgRepo },
      ],
    }).compile();

    handler = module.get<DeleteMessageHandler>(DeleteMessageHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete own message', async () => {
    msgRepo.findById.mockResolvedValue(
      new Message('msg-1', 'conv-1', 'user-a', 'Hello', false, false, new Date()),
    );
    msgRepo.softDelete.mockResolvedValue(undefined);

    await handler.execute(new DeleteMessageImpl('msg-1', 'user-a'));
    expect(msgRepo.softDelete).toHaveBeenCalledWith('msg-1');
  });

  it('should throw NotFoundException if message does not exist', async () => {
    msgRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteMessageImpl('bad-msg', 'user-a')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if not the sender', async () => {
    msgRepo.findById.mockResolvedValue(
      new Message('msg-1', 'conv-1', 'user-a', 'Hello', false, false, new Date()),
    );

    await expect(
      handler.execute(new DeleteMessageImpl('msg-1', 'user-b')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    msgRepo.findById.mockResolvedValue(
      new Message('msg-1', 'conv-1', 'user-a', 'Hello', false, false, new Date()),
    );
    msgRepo.softDelete.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new DeleteMessageImpl('msg-1', 'user-a')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
