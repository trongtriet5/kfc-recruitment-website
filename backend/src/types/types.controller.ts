import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TypesService } from './types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { CreateTypeCategoryDto } from './dto/create-type-category.dto';
import { CreateTypeDto } from './dto/create-type.dto';

@Controller('types')
@UseGuards(JwtAuthGuard)
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  // ============ Type Categories ============
  @Post('categories')
  createCategory(@Body() createDto: CreateTypeCategoryDto, @CurrentUser() user: User) {
    return this.typesService.createCategory(createDto, user);
  }

  @Get('categories')
  getCategories(
    @CurrentUser() user: User,
    @Query('module') module?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.typesService.getCategories(user, {
      module,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.typesService.getCategory(id, user);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTypeCategoryDto>,
    @CurrentUser() user: User,
  ) {
    return this.typesService.updateCategory(id, updateDto, user);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.typesService.deleteCategory(id, user);
  }

  // ============ Types ============
  @Post('types')
  createType(@Body() createDto: CreateTypeDto, @CurrentUser() user: User) {
    return this.typesService.createType(createDto, user);
  }

  @Get('types')
  getTypes(
    @CurrentUser() user: User,
    @Query('categoryId') categoryId?: string,
    @Query('module') module?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.typesService.getTypes(user, {
      categoryId,
      module,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('types/:id')
  getType(@Param('id') id: string, @CurrentUser() user: User) {
    return this.typesService.getType(id, user);
  }

  @Patch('types/:id')
  updateType(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTypeDto>,
    @CurrentUser() user: User,
  ) {
    return this.typesService.updateType(id, updateDto, user);
  }

  @Delete('types/:id')
  deleteType(@Param('id') id: string, @CurrentUser() user: User) {
    return this.typesService.deleteType(id, user);
  }

  // Helper endpoint
  @Get('by-category/:categoryCode')
  getTypesByCategoryCode(@Param('categoryCode') categoryCode: string, @CurrentUser() user: User) {
    return this.typesService.getTypesByCategoryCode(categoryCode, user);
  }
}

