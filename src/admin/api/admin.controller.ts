import { Controller, Post, Get, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AdminAuthService } from "../admin-auth.service";
import { AdminService } from "../admin.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { ObserverGuard } from "../guards/observer.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { LoginAdminDto } from "./dto/login-admin.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { SuspendUserDto } from "./dto/suspend-user.dto";
import { SuspendEventDto } from "./dto/suspend-event.dto";

@Controller('admin')
export class AdminController {
  constructor(
    private readonly authService: AdminAuthService,
    private readonly adminService: AdminService,
  ) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginAdminDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaffUser(dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listStaff() {
    return this.adminService.listStaffUsers();
  }

  @Patch('users/:userId/suspend')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async suspendUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(userId, dto.suspend);
  }

  @Patch('events/:eventId/suspend')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async suspendEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: SuspendEventDto,
  ) {
    return this.adminService.suspendEvent(eventId, dto.status);
  }

  @Post('interests')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async addInterest(@Body() body: { name: string; icon?: string; colorHex?: string }) {
    return this.adminService.addInterest(body.name, body.icon, body.colorHex);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  async deleteReview(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    return this.adminService.deleteReview(reviewId);
  }
}
