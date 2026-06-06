import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { findUserByIdHandler } from 'src/users/application/queries/handler/find-user-byId.handler';
import { FindUserByEmailHandler } from 'src/users/application/queries/handler/find-user-by-email.handler';
import { UpdateUserStatusHandler } from 'src/users/application/commands/handler/update-user-status.handler';
import { UpdateUserProfileHandler } from 'src/users/application/commands/handler/update-user-profile.handler';
import { ID_USER_REPOSITORY, UserRepository } from 'src/users/domain/repositories/user.repository';
import { User } from 'src/users/domain/entities/user.entity';
import { findUserByIdImpl } from 'src/users/application/queries/impl/find-user-byId.impl';
import { FindUserByEmailImpl } from 'src/users/application/queries/impl/find-user-by-email.impl';
import { UpdateUserStatusImpl } from 'src/users/application/commands/impl/update-user-status.impl';
import { UpdateUserProfileImpl } from 'src/users/application/commands/impl/update-user-profile.impl';

function createMockUser(id: string, overrides: Partial<User> = {}): User {
  return new User(
    id,
    overrides.username ?? 'user',
    overrides.email ?? `${id}@test.com`,
    overrides.google_id,
    overrides.phone,
    overrides.password_hash,
    overrides.full_name,
    overrides.bio,
    overrides.avatar_url,
    overrides.lat,
    overrides.lng,
    overrides.country,
    overrides.city,
    overrides.reputation_score ?? 5.0,
    overrides.total_reviews ?? 0,
    overrides.is_verified ?? false,
    overrides.status ?? 'active',
    overrides.created_at ?? new Date(),
    overrides.role ?? 'user',
    overrides.refresh_token,
  );
}

describe('findUserByIdHandler', () => {
  let handler: findUserByIdHandler;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    repo = { findById: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        findUserByIdHandler,
        { provide: ID_USER_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<findUserByIdHandler>(findUserByIdHandler);
  });

  it('should return a user when found', async () => {
    const user = createMockUser('user-1');
    repo.findById.mockResolvedValue(user);

    const result = await handler.execute(new findUserByIdImpl('user-1'));
    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(user);
  });

  it('should throw NotFoundException when user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new findUserByIdImpl('bad-id')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('FindUserByEmailHandler', () => {
  let handler: FindUserByEmailHandler;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    repo = { findByEmail: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByEmailHandler,
        { provide: ID_USER_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<FindUserByEmailHandler>(FindUserByEmailHandler);
  });

  it('should return a user when found by email', async () => {
    const user = createMockUser('user-1', { email: 'test@test.com' });
    repo.findByEmail.mockResolvedValue(user);

    const result = await handler.execute(new FindUserByEmailImpl('test@test.com'));
    expect(repo.findByEmail).toHaveBeenCalledWith('test@test.com');
    expect(result).toEqual(user);
  });

  it('should throw NotFoundException when email not found', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new FindUserByEmailImpl('unknown@test.com')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('UpdateUserStatusHandler', () => {
  let handler: UpdateUserStatusHandler;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    repo = { findById: jest.fn(), updateStatus: jest.fn(), complete: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserStatusHandler,
        { provide: ID_USER_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<UpdateUserStatusHandler>(UpdateUserStatusHandler);
  });

  it('should deactivate a user', async () => {
    const user = createMockUser('user-1', { status: 'active' });
    repo.findById.mockResolvedValue(user);
    repo.updateStatus.mockResolvedValue(undefined);

    const result = await handler.execute(new UpdateUserStatusImpl('user-1', 'blocked'));
    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.updateStatus).toHaveBeenCalledWith('user-1', 'blocked');
    expect(result.status).toBe('blocked');
  });

  it('should reactivate a user', async () => {
    const user = createMockUser('user-1', { status: 'blocked' });
    repo.findById.mockResolvedValue(user);
    repo.updateStatus.mockResolvedValue(undefined);

    const result = await handler.execute(new UpdateUserStatusImpl('user-1', 'active'));
    expect(result.status).toBe('active');
  });

  it('should throw NotFoundException when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateUserStatusImpl('bad-id', 'blocked')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should ban a user', async () => {
    const user = createMockUser('user-1', { status: 'active' });
    repo.findById.mockResolvedValue(user);
    repo.updateStatus.mockResolvedValue(undefined);

    const result = await handler.execute(new UpdateUserStatusImpl('user-1', 'banned'));
    expect(repo.updateStatus).toHaveBeenCalledWith('user-1', 'banned');
    expect(result.status).toBe('banned');
  });
});

describe('UpdateUserProfileHandler', () => {
  let handler: UpdateUserProfileHandler;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    repo = { findById: jest.fn(), updatePartial: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserProfileHandler,
        { provide: ID_USER_REPOSITORY, useValue: repo },
      ],
    }).compile();

    handler = module.get<UpdateUserProfileHandler>(UpdateUserProfileHandler);
  });

  it('should update user profile fields', async () => {
    const user = createMockUser('user-1');
    repo.findById.mockResolvedValue(user);
    repo.updatePartial.mockResolvedValue(true);

    const result = await handler.execute(
      new UpdateUserProfileImpl('user-1', '123456789', 'New Name', 'Hello!'),
    );

    expect(repo.findById).toHaveBeenCalledWith('user-1');
    expect(repo.updatePartial).toHaveBeenCalledWith('user-1', {
      phone: '123456789',
      full_name: 'New Name',
      bio: 'Hello!',
      avatar_url: undefined,
      lat: undefined,
      lng: undefined,
      country: undefined,
      city: undefined,
    });
    expect(result).toBe(true);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateUserProfileImpl('bad-id')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw InternalServerErrorException on repo error', async () => {
    const user = createMockUser('user-1');
    repo.findById.mockResolvedValue(user);
    repo.updatePartial.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new UpdateUserProfileImpl('user-1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
