import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  AddAddressDto,
  UpdateAddressDto,
  ChangePasswordDto,
} from './dto/users.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles, UserRole } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with address book' })
  @ResponseMessage('User profile retrieved successfully')
  async getProfile(@CurrentUser('userId') userId: string): Promise<Record<string, any>> {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile details' })
  @ResponseMessage('Profile updated successfully')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<Record<string, any>> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new shipping address' })
  @ResponseMessage('Address added successfully')
  async addAddress(
    @CurrentUser('userId') userId: string,
    @Body() dto: AddAddressDto,
  ) {
    return this.usersService.addAddress(userId, dto);
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update an existing shipping address' })
  @ResponseMessage('Address updated successfully')
  async updateAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  @ApiOperation({ summary: 'Remove a shipping address from address book' })
  @ResponseMessage('Address deleted successfully')
  async deleteAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(userId, addressId);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Update account password' })
  @ResponseMessage('Password changed successfully')
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all registered customers (Admin only)' })
  @ResponseMessage('Users list retrieved successfully')
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: any[]; meta: any }> {
    return this.usersService.findAll(parseInt(page, 10), parseInt(limit, 10));
  }
}

