import { Controller, Post, Body, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('USER_CREATE')
  @Post('users')
  async createUser(@Request() req, @Body() createDto: CreateUserDto) {
    return this.authService.createUser(createDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('USER_VIEW_ALL')
  @Get('users')
  async getAllUsers(@Request() req) {
    return this.authService.getAllUsers(req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('USER_UPDATE')
  @Patch('users/:id')
  async updateUser(@Request() req, @Param('id') id: string, @Body() updateDto: Partial<CreateUserDto>) {
    return this.authService.updateUser(id, updateDto, req.user);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('USER_DELETE')
  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    return this.authService.deleteUser(id, req.user);
  }
}

