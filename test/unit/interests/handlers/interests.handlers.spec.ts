import { Test, TestingModule } from '@nestjs/testing';
import { INTEREST_KAY, Interests } from 'src/interests/domain/entities/interests.entities';
import { InterestsRepositories } from 'src/interests/domain/repositories/interests.repositories';
import { CreateInterestsHandler } from 'src/interests/application/commands/handler/create.interests.handler';
import { GetAllInterestsHandler } from 'src/interests/application/queries/handler/getall.interests.handler';
import { GetInterestsByIdHandler } from 'src/interests/application/queries/handler/get.interestsByid.handler';
import { DeleteInterestsHandler } from 'src/interests/application/queries/handler/delete.interests.handler';
import { CreateInterestsImpl } from 'src/interests/application/commands/impl/create.interests.impl';
import { GetAllInterestsImpl } from 'src/interests/application/queries/impl/getall.interests.impl';
import { GetInterestByIdImpl } from 'src/interests/application/queries/impl/get.interestsByid.impl';
import { DeleteInterestsImpl } from 'src/interests/application/queries/impl/delete.interests.impl';

describe('CreateInterestsHandler', () => {
  let handler: CreateInterestsHandler;
  let repo: jest.Mocked<InterestsRepositories>;

  beforeEach(async () => {
    repo = { create: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateInterestsHandler,
        { provide: INTEREST_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<CreateInterestsHandler>(CreateInterestsHandler);
  });

  it('should create an interest', async () => {
    const expected = new Interests(1, 'Music', '🎵', '#fff');
    repo.create.mockResolvedValue(expected);

    const result = await handler.execute(new CreateInterestsImpl('Music', '🎵', '#fff'));

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Music', icon: '🎵', color_hex: '#fff' }),
    );
    expect(result).toEqual(expected);
  });
});

describe('GetAllInterestsHandler', () => {
  let handler: GetAllInterestsHandler;
  let repo: jest.Mocked<InterestsRepositories>;

  beforeEach(async () => {
    repo = { getAllInterests: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllInterestsHandler,
        { provide: INTEREST_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetAllInterestsHandler>(GetAllInterestsHandler);
  });

  it('should return all interests', async () => {
    const expected = [new Interests(1, 'Music')];
    repo.getAllInterests.mockResolvedValue(expected);

    const result = await handler.execute(new GetAllInterestsImpl());
    expect(result).toEqual(expected);
  });
});

describe('GetInterestsByIdHandler', () => {
  let handler: GetInterestsByIdHandler;
  let repo: jest.Mocked<InterestsRepositories>;

  beforeEach(async () => {
    repo = { getById: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInterestsByIdHandler,
        { provide: INTEREST_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<GetInterestsByIdHandler>(GetInterestsByIdHandler);
  });

  it('should return interest by id', async () => {
    const expected = new Interests(1, 'Music');
    repo.getById.mockResolvedValue(expected);

    const result = await handler.execute(new GetInterestByIdImpl(1));
    expect(result).toEqual(expected);
  });

  it('should return null if not found', async () => {
    repo.getById.mockResolvedValue(null);

    const result = await handler.execute(new GetInterestByIdImpl(999));
    expect(result).toBeNull();
  });
});

describe('DeleteInterestsHandler', () => {
  let handler: DeleteInterestsHandler;
  let repo: jest.Mocked<InterestsRepositories>;

  beforeEach(async () => {
    repo = { delete: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteInterestsHandler,
        { provide: INTEREST_KAY, useValue: repo },
      ],
    }).compile();

    handler = module.get<DeleteInterestsHandler>(DeleteInterestsHandler);
  });

  it('should delete an interest', async () => {
    repo.delete.mockResolvedValue(true);

    const result = await handler.execute(new DeleteInterestsImpl('admin-1', 1));
    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });
});
