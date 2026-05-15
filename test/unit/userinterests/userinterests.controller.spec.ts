import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserInterestsController } from 'src/userinterests/api/userinterests.controller';
import { User } from 'src/users/domain/entities/user.entity';
import { AddUserInterestImpl } from 'src/userinterests/application/commands/impl/add-user-interest.impl';
import { RemoveUserInterestImpl } from 'src/userinterests/application/commands/impl/remove-user-interest.impl';
import { GetUserInterestsImpl } from 'src/userinterests/application/queries/impl/get-user-interests.impl';
import { GetOneUserInterestImpl } from 'src/userinterests/application/queries/impl/get-one-user-interest.impl';

describe('UserInterestsController', () => {
  let controller: UserInterestsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserInterestsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<UserInterestsController>(UserInterestsController);
  });

  const mockUser = { id: 'user-1' } as User;

  describe('getAll', () => {
    it('should execute GetUserInterestsImpl', async () => {
      const expected = [{ user_id: 'user-1', interest_id: 1 }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getAll(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetUserInterestsImpl('user-1'));
      expect(result).toEqual(expected);
    });
  });

  describe('getOne', () => {
    it('should execute GetOneUserInterestImpl', async () => {
      const expected = { user_id: 'user-1', interest_id: 1 };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getOne(1, mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetOneUserInterestImpl('user-1', 1));
      expect(result).toEqual(expected);
    });
  });

  describe('add', () => {
    it('should execute AddUserInterestImpl', async () => {
      const dto = { interestId: 1 };
      const expected = { user_id: 'user-1', interest_id: 1 };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.add(dto, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new AddUserInterestImpl('user-1', 1));
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('should execute RemoveUserInterestImpl', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.remove(1, mockUser);
      expect(commandBus.execute).toHaveBeenCalledWith(new RemoveUserInterestImpl('user-1', 1));
    });
  });
});
