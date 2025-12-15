import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        position: true,
        employee: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        position: user.position,
        employee: user.employee,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        position: true,
        employee: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updateData: any = {};

    // Update basic info
    if (updateDto.fullName) {
      updateData.fullName = updateDto.fullName;
    }

    if (updateDto.email) {
      // Check if email is already taken by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email đã được sử dụng bởi người dùng khác');
      }
      updateData.email = updateDto.email;
    }

    if (updateDto.phone) {
      updateData.phone = updateDto.phone;
    }

    // Update password if provided
    if (updateDto.newPassword) {
      if (!updateDto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
      }

      // Verify current password
      const isValid = await bcrypt.compare(updateDto.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(updateDto.newPassword, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: true,
        position: true,
        employee: true,
      },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }

  async createUser(createDto: CreateUserDto, creator: any) {
    // Only ADMIN can create users
    if (creator.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create users');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createDto.email,
        password: hashedPassword,
        fullName: createDto.fullName,
        phone: createDto.phone,
        role: createDto.role,
        departmentId: createDto.departmentId,
        positionId: createDto.positionId,
        employeeId: createDto.employeeId,
      },
      include: {
        department: true,
        position: true,
        employee: true,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async getAllUsers(requester: any) {
    // Only ADMIN and HEAD_OF_DEPARTMENT can view all users
    if (requester.role !== UserRole.ADMIN && requester.role !== UserRole.HEAD_OF_DEPARTMENT) {
      throw new ForbiddenException('You don\'t have permission to view all users');
    }

    return this.prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        department: true,
        position: true,
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUser(userId: string, updateDto: Partial<CreateUserDto>, updater: any) {
    // Only ADMIN can update users
    if (updater.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: any = {};

    if (updateDto.fullName) {
      updateData.fullName = updateDto.fullName;
    }

    if (updateDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email đã được sử dụng bởi người dùng khác');
      }
      updateData.email = updateDto.email;
    }

    if (updateDto.phone !== undefined) {
      updateData.phone = updateDto.phone;
    }

    if (updateDto.role) {
      updateData.role = updateDto.role;
    }

    if (updateDto.departmentId !== undefined) {
      updateData.departmentId = updateDto.departmentId;
    }

    if (updateDto.positionId !== undefined) {
      updateData.positionId = updateDto.positionId;
    }

    if (updateDto.employeeId !== undefined) {
      updateData.employeeId = updateDto.employeeId;
    }

    if (updateDto.password) {
      updateData.password = await bcrypt.hash(updateDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: true,
        position: true,
        employee: true,
      },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }

  async deleteUser(userId: string, deleter: any) {
    // Only ADMIN can delete users
    if (deleter.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete users');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Soft delete by setting isActive to false
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}

