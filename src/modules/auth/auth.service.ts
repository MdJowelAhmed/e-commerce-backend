import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '@modules/users/schemas/user.schema';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { UserRole } from '@common/decorators/roles.decorator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user customer account
   */
  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      phone: dto.phone || null,
      roles: [UserRole.CUSTOMER],
    });

    await newUser.save();

    const tokens = await this.generateTokens(newUser._id.toString(), newUser.email, newUser.roles);
    await this.updateRefreshTokenHash(newUser._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        roles: newUser.roles,
      },
      tokens,
    };
  }

  /**
   * Authenticate user credentials and return access + refresh tokens
   */
  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password');

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.roles);
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
      tokens,
    };
  }

  /**
   * Refresh rotated access and refresh tokens
   */
  async refreshTokens(userId: string, incomingRefreshToken: string) {
    const user = await this.userModel.findById(userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied or session expired');
    }

    const isMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Possible token reuse detected - invalidate all tokens for security
      await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
      this.logger.warn(`Potential token reuse detected for user ${userId}. Revoked refresh token.`);
      throw new UnauthorizedException('Token validation failed. Please log in again.');
    }

    // Verify refresh token signature & expiration
    try {
      this.jwtService.verify(incomingRefreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Rotate tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email, user.roles);
    await this.updateRefreshTokenHash(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  /**
   * Log out user and clear refresh token hash
   */
  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
    return { loggedOut: true };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    // Defensive response: Do not leak whether an account exists
    if (!user) {
      return {
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      };
    }

    // Generate unhashed 32-byte hex reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token with SHA-256 for persistent database storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 30 minutes
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = tokenExpires;
    await user.save();

    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    this.logger.log(`[PASSWORD RESET] Dispatching reset link for ${user.email}: ${resetLink}`);

    const isDev = this.configService.get<string>('env') !== 'production';

    return {
      message: 'If an account exists with that email, a password reset link has been dispatched.',
      // In development mode, return token & link directly to facilitate rapid frontend integration/testing
      ...(isDev ? { resetToken, resetLink, expiresAt: tokenExpires } : {}),
    };
  }

  /**
   * Reset password using verification token
   */
  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const user = await this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+password');

    if (!user) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(dto.newPassword, salt);

    // Invalidate reset token and revoke active refresh tokens
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokenHash = null;

    await user.save();

    this.logger.log(`Password successfully reset for user ${user.email}`);

    return {
      message: 'Password reset successful. You can now log in with your new password.',
    };
  }

  /**
   * Generate short-lived Access Token & long-lived Refresh Token
   */
  private async generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret')!,
        expiresIn: this.configService.get<string>('jwt.accessExpiration') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
        expiresIn: this.configService.get<string>('jwt.refreshExpiration') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Securely hash and store the refresh token
   */
  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: hash });
  }
}

