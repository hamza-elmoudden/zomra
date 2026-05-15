import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InterestsController } from 'src/interests/api/interests.controller';
import { GetAllInterestsImpl } from 'src/interests/application/queries/impl/getall.interests.impl';
import { GetInterestByIdImpl } from 'src/interests/application/queries/impl/get.interestsByid.impl';
import { CreateInterestsImpl } from 'src/interests/application/commands/impl/create.interests.impl';
import { DeleteInterestsImpl } from 'src/interests/application/queries/impl/delete.interests.impl';

describe('InterestsController', () => {
  let controller: InterestsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as any;
    queryBus = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterestsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<InterestsController>(InterestsController);
  });

  describe('getallInterests', () => {
    it('should execute GetAllInterestsImpl', async () => {
      const expected = [{ id: 1, name: 'Music' }];
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getallInterests();
      expect(queryBus.execute).toHaveBeenCalledWith(new GetAllInterestsImpl());
      expect(result).toEqual(expected);
    });
  });

  describe('getById', () => {
    it('should execute GetInterestByIdImpl', async () => {
      const expected = { id: 1, name: 'Music' };
      queryBus.execute.mockResolvedValue(expected);

      const result = await controller.getById(1);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetInterestByIdImpl(1));
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('should execute CreateInterestsImpl', async () => {
      const dto = { name: 'Music', icon: '🎵', color_hex: '#fff' };
      const expected = { id: 1, name: 'Music', icon: '🎵', color_hex: '#fff' };
      commandBus.execute.mockResolvedValue(expected);

      const result = await controller.create(dto);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateInterestsImpl('Music', '🎵', '#fff'),
      );
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('should execute DeleteInterestsImpl', async () => {
      const req = { user: { id: 'admin-1' } };
      queryBus.execute.mockResolvedValue(true);

      const result = await controller.delete(1, req);
      expect(queryBus.execute).toHaveBeenCalledWith(new DeleteInterestsImpl('admin-1', 1));
      expect(result).toBe(true);
    });
  });
});
