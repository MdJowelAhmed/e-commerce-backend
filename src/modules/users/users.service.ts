import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto, AddAddressDto, UpdateAddressDto, ChangePasswordDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getProfile(userId: string): Promise<Record<string, any>> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, refreshTokenHash, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Record<string, any>> {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('User not found');
    }
    const { password, refreshTokenHash, ...profile } = updated;
    return profile;
  }

  async addAddress(userId: string, dto: AddAddressDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If first address or marked default, unmark other default addresses
    if (user.addresses.length === 0 || dto.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      dto.isDefault = true;
    }

    user.addresses.push(dto as any);
    await user.save();
    return user.addresses;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addrIndex = user.addresses.findIndex((a) => a._id.toString() === addressId);
    if (addrIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(user.addresses[addrIndex], dto);
    await user.save();
    return user.addresses[addrIndex];
  }

  async deleteAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId);
    await user.save();
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user || !user.password) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(dto.newPassword, salt);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async findAll(page = 1, limit = 20): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(),
    ]);

    return {
      data: users.map(({ password, refreshTokenHash, ...rest }) => rest),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

