import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('select')
  getForSelect(@Query('role') role?: string) {
    return this.usersService.getForSelect(role);
  }

  @Get('stores-for-assign')
  getStoresForAssign() {
    return this.usersService.getStoresForAssign();
  }

  @Get('export')
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
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('import')
  importUsers(@Body() data: any) {
    return this.usersService.importUsers(data);
  }

  @Post('import-file')
  @UseInterceptors(FileInterceptor('file'))
  importUsersFromFile(@UploadedFile() file: Express.Multer.File) {
    return this.usersService.importUsersFromFile(file);
  }
}
