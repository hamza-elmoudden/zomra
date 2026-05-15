import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from 'src/admin/api/admin.controller';
import { AdminAuthService } from 'src/admin/admin-auth.service';
import { AdminService } from 'src/admin/admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let authService: jest.Mocked<AdminAuthService>;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    } as any;

    adminService = {
      createStaffUser: jest.fn(),
      listStaffUsers: jest.fn(),
      suspendUser: jest.fn(),
      suspendEvent: jest.fn(),
      addInterest: jest.fn(),
      deleteReview: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminAuthService, useValue: authService },
        { provide: AdminService, useValue: adminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  describe('login', () => {
    it('should call authService.login with credentials', async () => {
      const dto = { email: 'admin@test.com', password: '123456789' };
      const expected = { accessToken: 'token', refreshToken: 'refresh', user: { id: '1', email: 'admin@test.com', fullName: 'Admin', role: 'admin' } };
      authService.login.mockResolvedValue(expected as any);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expected);
    });
  });

  describe('createStaff', () => {
    it('should call adminService.createStaffUser', async () => {
      const dto = { username: 'staff', email: 'staff@test.com', password: '123456789', fullName: 'Staff', role: 'admin' as const };
      adminService.createStaffUser.mockResolvedValue({ id: '1' } as any);

      const result = await controller.createStaff(dto);
      expect(adminService.createStaffUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('listStaff', () => {
    it('should call adminService.listStaffUsers', async () => {
      const staffList = [{ id: '1', username: 'admin1' }];
      adminService.listStaffUsers.mockResolvedValue(staffList as any);

      const result = await controller.listStaff();
      expect(adminService.listStaffUsers).toHaveBeenCalled();
      expect(result).toEqual(staffList);
    });
  });

  describe('suspendUser', () => {
    it('should call adminService.suspendUser with userId and suspend flag', async () => {
      adminService.suspendUser.mockResolvedValue(true as any);

      const result = await controller.suspendUser('user-id', { suspend: true });
      expect(adminService.suspendUser).toHaveBeenCalledWith('user-id', true);
      expect(result).toBe(true);
    });
  });

  describe('suspendEvent', () => {
    it('should call adminService.suspendEvent with eventId and status', async () => {
      adminService.suspendEvent.mockResolvedValue({ id: 'event-id' } as any);

      const result = await controller.suspendEvent('event-id', { status: 'cancelled' as any });
      expect(adminService.suspendEvent).toHaveBeenCalledWith('event-id', 'cancelled');
      expect(result).toEqual({ id: 'event-id' });
    });
  });

  describe('addInterest', () => {
    it('should call adminService.addInterest with name, icon, colorHex', async () => {
      adminService.addInterest.mockResolvedValue({ id: '1', name: 'Music' } as any);

      const result = await controller.addInterest({ name: 'Music', icon: '🎵', colorHex: '#fff' });
      expect(adminService.addInterest).toHaveBeenCalledWith('Music', '🎵', '#fff');
      expect(result).toEqual({ id: '1', name: 'Music' });
    });
  });

  describe('deleteReview', () => {
    it('should call adminService.deleteReview with reviewId', async () => {
      adminService.deleteReview.mockResolvedValue(undefined);

      const result = await controller.deleteReview('review-id');
      expect(adminService.deleteReview).toHaveBeenCalledWith('review-id');
      expect(result).toBeUndefined();
    });
  });
});
