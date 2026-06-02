import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MediaController } from 'src/media/api/media.controller';
import { User } from 'src/users/domain/entities/user.entity';
import { media_type } from 'generated/prisma/enums';
import { UploadMediaImpl } from 'src/media/application/commands/impl/upload-media.impl';
import { DeleteMediaImpl } from 'src/media/application/commands/impl/delete-media.impl';
import { GetEventMediaImpl } from 'src/media/application/queries/impl/get-event-media.impl';

describe('MediaController', () => {
  let controller: MediaController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('upload', () => {
    it('should execute UploadMediaImpl', async () => {
      const file = { originalname: 'photo.jpg', buffer: Buffer.from('test'), mimetype: 'image/jpeg' } as Express.Multer.File;
      const dto = { mediaType: 'photo' };
      const expected = { id: 'media-1' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.upload('event-1', file, dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', file.buffer, 'image/jpeg', 'photo'),
      );
      expect(result).toEqual(expected);
    });

    it('should default mediaType to photo if not provided', async () => {
      const file = { originalname: 'photo.jpg', buffer: Buffer.from('test'), mimetype: 'image/jpeg' } as Express.Multer.File;
      commandBus.execute.mockResolvedValue({ id: 'media-2' });

      await controller.upload('event-1', file, {}, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', file.buffer, 'image/jpeg', media_type.photo),
      );
    });

    it('should throw BadRequestException if no file', async () => {
      await expect(
        controller.upload('event-1', null as any, {}, mockUser),
      ).rejects.toThrow('No file uploaded');
    });
  });

  describe('getEventMedia', () => {
    it('should execute GetEventMediaImpl', async () => {
      const expected = [{ id: 'm1' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getEventMedia('event-1');
      expect(queryBus.execute).toHaveBeenCalledWith(new GetEventMediaImpl('event-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('should execute DeleteMediaImpl', async () => {
      await controller.delete('media-1', mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new DeleteMediaImpl('media-1', 'user-1'));
    });
  });
});
