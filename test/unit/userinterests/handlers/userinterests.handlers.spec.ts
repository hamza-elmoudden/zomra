import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { USER_INTERESTS, UserInterests } from 'src/userinterests/domain/entities/user.entities';
import { UserInterestsRepositories } from 'src/userinterests/domain/repositories/userinterests.repositories';
import { AddUserInterestHandler } from 'src/userinterests/application/commands/handler/add-user-interest.handler';
import { RemoveUserInterestHandler } from 'src/userinterests/application/commands/handler/remove-user-interest.handler';
import { GetUserInterestsHandler } from 'src/userinterests/application/queries/handler/get-user-interests.handler';
import { GetOneUserInterestHandler } from 'src/userinterests/application/queries/handler/get-one-user-interest.handler';
import { AddUserInterestImpl } from 'src/userinterests/application/commands/impl/add-user-interest.impl';
import { RemoveUserInterestImpl } from 'src/userinterests/application/commands/impl/remove-user-interest.impl';
import { GetUserInterestsImpl } from 'src/userinterests/application/queries/impl/get-user-interests.impl';
import { GetOneUserInterestImpl } from 'src/userinterests/application/queries/impl/get-one-user-interest.impl';

describe('AddUserInterestHandler', () => {
  let handler: AddUserInterestHandler;
  let repo: jest.Mocked<UserInterestsRepositories>;

  beforeEach(async () => {
    repo = {
      getOneUserInterest: jest.fn(),
      createUserInterest: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddUserInterestHandler,
        { provide: USER_INTERESTS, useValue: repo },
      ],
    }).compile();

    handler = module.get<AddUserInterestHandler>(AddUserInterestHandler);
  });

  it('should add an interest for a user', async () => {
    repo.getOneUserInterest.mockResolvedValue(null);
    const expected = new UserInterests('user-1', 1);
    repo.createUserInterest.mockResolvedValue(expected);

    const result = await handler.execute(new AddUserInterestImpl('user-1', 1));

    expect(repo.getOneUserInterest).toHaveBeenCalledWith('user-1', 1);
    expect(repo.createUserInterest).toHaveBeenCalledWith('user-1', 1);
    expect(result).toEqual(expected);
  });

  it('should throw ConflictException if interest already exists', async () => {
    repo.getOneUserInterest.mockResolvedValue(new UserInterests('user-1', 1));

    await expect(
      handler.execute(new AddUserInterestImpl('user-1', 1)),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw InternalServerErrorException on create error', async () => {
    repo.getOneUserInterest.mockResolvedValue(null);
    repo.createUserInterest.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new AddUserInterestImpl('user-1', 1)),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('RemoveUserInterestHandler', () => {
  let handler: RemoveUserInterestHandler;
  let repo: jest.Mocked<UserInterestsRepositories>;

  beforeEach(async () => {
    repo = {
      getOneUserInterest: jest.fn(),
      deleteUserInterest: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveUserInterestHandler,
        { provide: USER_INTERESTS, useValue: repo },
      ],
    }).compile();

    handler = module.get<RemoveUserInterestHandler>(RemoveUserInterestHandler);
  });

  it('should remove an interest from a user', async () => {
    repo.getOneUserInterest.mockResolvedValue(new UserInterests('user-1', 1));
    repo.deleteUserInterest.mockResolvedValue(undefined);

    await handler.execute(new RemoveUserInterestImpl('user-1', 1));
    expect(repo.deleteUserInterest).toHaveBeenCalledWith('user-1', 1);
  });

  it('should throw NotFoundException if interest not found', async () => {
    repo.getOneUserInterest.mockResolvedValue(null);

    await expect(
      handler.execute(new RemoveUserInterestImpl('user-1', 1)),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on delete error', async () => {
    repo.getOneUserInterest.mockResolvedValue(new UserInterests('user-1', 1));
    repo.deleteUserInterest.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new RemoveUserInterestImpl('user-1', 1)),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('GetUserInterestsHandler', () => {
  let handler: GetUserInterestsHandler;
  let repo: jest.Mocked<UserInterestsRepositories>;

  beforeEach(async () => {
    repo = { getAllUserInterests: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserInterestsHandler,
        { provide: USER_INTERESTS, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetUserInterestsHandler>(GetUserInterestsHandler);
  });

  it('should return all interests for a user', async () => {
    const expected = [new UserInterests('user-1', 1)];
    repo.getAllUserInterests.mockResolvedValue(expected);

    const result = await handler.execute(new GetUserInterestsImpl('user-1'));
    expect(repo.getAllUserInterests).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });
});

describe('GetOneUserInterestHandler', () => {
  let handler: GetOneUserInterestHandler;
  let repo: jest.Mocked<UserInterestsRepositories>;

  beforeEach(async () => {
    repo = { getOneUserInterest: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOneUserInterestHandler,
        { provide: USER_INTERESTS, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetOneUserInterestHandler>(GetOneUserInterestHandler);
  });

  it('should return a specific user interest', async () => {
    const expected = new UserInterests('user-1', 1);
    repo.getOneUserInterest.mockResolvedValue(expected);

    const result = await handler.execute(new GetOneUserInterestImpl('user-1', 1));
    expect(result).toEqual(expected);
  });

  it('should throw NotFoundException if not found', async () => {
    repo.getOneUserInterest.mockResolvedValue(null);

    await expect(
      handler.execute(new GetOneUserInterestImpl('user-1', 999)),
    ).rejects.toThrow(NotFoundException);
  });
});
