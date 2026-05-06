import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('select')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  getForSelect(@Query('role') role?: string) {
    return this.usersService.getForSelect(role);
  }

  @Get('stores-for-assign')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  getStoresForAssign() {
    return this.usersService.getStoresForAssign();
  }

  @Get('export')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  async exportUsers(@Res() res: Response) {
    const workbook = await this.usersService.exportUsers();
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'users.xlsx',
    );

    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  }

  @Post()
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('import')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  importUsers(@Body() data: any) {
    return this.usersService.importUsers(data);
  }

  @Post('import-file')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  importUsersFromFile(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.importUsersFromFile(file);
  }
}
