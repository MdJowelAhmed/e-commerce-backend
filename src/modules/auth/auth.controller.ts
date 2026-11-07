import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Account successfully registered')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'User registered and tokens set in cookies' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setTokenCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'User authenticated and cookies set' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setTokenCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed successfully')
  @ApiOperation({ summary: 'Rotate and refresh access token via HttpOnly cookie' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: RefreshTokenDto,
  ) {
    // Check cookie first, then fallback to body
    const refreshToken = request.cookies?.['refresh_token'] || body.refreshToken;
    const userId = request.cookies?.['user_id'] || request.headers['x-user-id'] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    // Decode token to extract sub if user_id wasn't in cookie
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const payload = JSON.parse(
          Buffer.from(refreshToken.split('.')[1], 'base64').toString('utf8'),
        );
        resolvedUserId = payload.sub;
      } catch {
        throw new UnauthorizedException('Malformed token');
      }
    }

    const tokens = await this.authService.refreshTokens(resolvedUserId, refreshToken);
    this.setTokenCookies(response, tokens.accessToken, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password reset request processed')
  @ApiOperation({ summary: 'Request a password reset link/token via email' })
  @ApiResponse({ status: 200, description: 'Password reset instructions dispatched' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password successfully reset')
  @ApiOperation({ summary: 'Reset account password using valid reset token' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ResponseMessage('Logged out successfully')
  @ApiOperation({ summary: 'Logout and clear session cookies' })
  async logout(
    @CurrentUser('userId') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (userId) {
      await this.authService.logout(userId);
    }
    this.clearTokenCookies(response);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ResponseMessage('Current user profile retrieved')
  @ApiOperation({ summary: 'Get profile information of currently logged in user' })
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  private setTokenCookies(response: Response, accessToken: string, refreshToken: string) {
    const isProd = this.configService.get<string>('env') === 'production';

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearTokenCookies(response: Response) {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/' });
  }
}

