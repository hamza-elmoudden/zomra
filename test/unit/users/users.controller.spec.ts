import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UsersController } from 'src/users/api/users.controller';
import { findUserByIdImpl } from 'src/users/application/queries/impl/find-user-byId.impl';
import { FindUserByEmailImpl } from 'src/users/application/queries/impl/find-user-by-email.impl';
import { UpdateUserStatusImpl } from 'src/users/application/commands/impl/update-user-status.impl';
import { UpdateUserProfileImpl } from 'src/users/application/commands/impl/update-user-profile.impl';
import { User } from 'src/users/domain/entities/user.entity';
import { StorageService } from 'src/media/infrastructure/storage.service';

describe('UsersController', () => {
  let controller: UsersController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;
    storageService = { uploadFile: jest.fn(), deleteFile: jest.fn(), getSignedUrl: jest.fn(), extractKeyFromUrl: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('findCurrentUser', () => {
    it('should execute findUserByIdImpl with current user id', async () => {
      const expected = { id: 'user-1', email: 'test@test.com' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.findCurrentUser(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new findUserByIdImpl('user-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('findUserById', () => {
    it('should execute findUserByIdImpl with param id', async () => {
      const expected = { id: 'user-2', email: 'other@test.com' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.findUserById('user-2');
      expect(queryBus.execute).toHaveBeenCalledWith(new findUserByIdImpl('user-2'));
      expect(result).toEqual(expected);
    });
  });

  describe('findUserByEmail', () => {
    it('should execute FindUserByEmailImpl with param email', async () => {
      const expected = { id: 'user-1', email: 'test@test.com' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.findUserByEmail('test@test.com');
      expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByEmailImpl('test@test.com'));
      expect(result).toEqual(expected);
    });
  });

  describe('updateUserStatus', () => {
    it('should execute UpdateUserStatusImpl with id and status', async () => {
      const expected = { id: 'user-1', status: 'blocked' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.updateUserStatus('user-1', { status: 'blocked' });
      expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserStatusImpl('user-1', 'blocked'));
      expect(result).toEqual(expected);
    });

    it('should pass active status when activating', async () => {
      commandBus.execute.mockResolvedValue({ id: 'user-1', status: 'active' });

      await controller.updateUserStatus('user-1', { status: 'active' });
      expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserStatusImpl('user-1', 'active'));
    });
  });

  describe('updateProfile', () => {
    it('should execute UpdateUserProfileImpl with current user', async () => {
      commandBus.execute.mockResolvedValue(true);

      const dto = { full_name: 'New Name', phone: '123456789', bio: 'Hello', country: 'Morocco', city: 'Casablanca' };
      const result = await controller.updateProfile(mockUser, dto);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateUserProfileImpl('user-1', '123456789', 'New Name', 'Hello', undefined, undefined, undefined, 'Morocco', 'Casablanca'),
      );
      expect(result).toBe(true);
    });

    it('should handle empty dto', async () => {
      commandBus.execute.mockResolvedValue(true);

      const result = await controller.updateProfile(mockUser, {});
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateUserProfileImpl('user-1', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined),
      );
      expect(result).toBe(true);
    });
  });
});
