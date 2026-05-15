import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from 'src/admin/admin.service';
import { ID_USER_REPOSITORY } from 'src/users/domain/repositories/user.repository';
import { EVENTS_KAY } from 'src/events/domain/repositories/events.repositories';
import { PrismaService } from 'src/prisma/prisma.service';
import { MockUserRepository, createMockUser } from 'test/mocks/repositories/mock-user-repository';
import { MockEventRepository, createMockEvent } from 'test/mocks/repositories/mock-event-repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  compare: jest.fn(),
}));

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: MockUserRepository;
  let eventRepo: MockEventRepository;
  let prismaMock: {
    interests: { create: jest.Mock };
    reviews: { delete: jest.Mock };
    users: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    userRepo = new MockUserRepository();
    eventRepo = new MockEventRepository();

    prismaMock = {
      interests: { create: jest.fn() },
      reviews: { delete: jest.fn() },
      users: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: ID_USER_REPOSITORY, useValue: userRepo },
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createStaffUser', () => {
    it('should create a staff user successfully', async () => {
      const result = await service.createStaffUser({
        username: 'staff1',
        email: 'staff@test.com',
        password: '123456789',
        fullName: 'Staff User',
        role: 'admin',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('staff@test.com');
      expect(result.role).toBe('admin');
      expect(result.is_active).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('123456789', 12);
    });

    it('should throw ConflictException if email already exists', async () => {
      const existing = createMockUser();
      userRepo.addUser(existing);

      await expect(
        service.createStaffUser({
          username: 'staff2',
          email: existing.email,
          password: '123456789',
          fullName: 'Staff User',
          role: 'observer',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('suspendUser', () => {
    it('should suspend a user', async () => {
      const user = createMockUser();
      userRepo.addUser(user);

      const result = await service.suspendUser(user.id, true);
      expect(result).toBe(true);
      const updated = await userRepo.findById(user.id);
      expect(updated?.is_active).toBe(false);
    });

    it('should unsuspend a user', async () => {
      const user = createMockUser();
      userRepo.addUser(user);

      await service.suspendUser(user.id, true);
      const result = await service.suspendUser(user.id, false);
      expect(result).toBe(true);
      const updated = await userRepo.findById(user.id);
      expect(updated?.is_active).toBe(true);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      await expect(
        service.suspendUser('nonexistent-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspendEvent', () => {
    it('should suspend an event by changing its status', async () => {
      const event = createMockEvent('host-id');
      eventRepo.addEvent(event);

      const result = await service.suspendEvent(event.id, 'cancelled' as any);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      await expect(
        service.suspendEvent('nonexistent-id', 'cancelled' as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addInterest', () => {
    it('should create an interest via prisma', async () => {
      const mockInterest = { id: '1', name: 'Music', icon: '🎵', color_hex: '#fff' };
      prismaMock.interests.create.mockResolvedValue(mockInterest);

      const result = await service.addInterest('Music', '🎵', '#fff');
      expect(result).toEqual(mockInterest);
      expect(prismaMock.interests.create).toHaveBeenCalledWith({
        data: { name: 'Music', icon: '🎵', color_hex: '#fff' },
      });
    });
  });

  describe('deleteReview', () => {
    it('should delete a review via prisma', async () => {
      prismaMock.reviews.delete.mockResolvedValue(undefined);

      await service.deleteReview('review-id');
      expect(prismaMock.reviews.delete).toHaveBeenCalledWith({
        where: { id: 'review-id' },
      });
    });

    it('should throw NotFoundException when review not found', async () => {
      prismaMock.reviews.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.deleteReview('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listStaffUsers', () => {
    it('should return staff users', async () => {
      const staffList = [
        { id: '1', username: 'admin1', email: 'admin@test.com', full_name: 'Admin', role: 'admin', is_active: true, created_at: new Date() },
      ];
      prismaMock.users.findMany.mockResolvedValue(staffList);

      const result = await service.listStaffUsers();
      expect(result).toEqual(staffList);
      expect(prismaMock.users.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['admin', 'observer'] } },
        select: expect.any(Object),
      });
    });
  });
});
