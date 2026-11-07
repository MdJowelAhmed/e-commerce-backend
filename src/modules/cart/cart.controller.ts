import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, SyncGuestCartDto } from './dto/cart.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get current user or guest cart' })
  @ApiHeader({ name: 'x-guest-session-id', required: false })
  @ResponseMessage('Cart retrieved successfully')
  async getCart(
    @CurrentUser('userId') userId?: string,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    return this.cartService.getCart(userId, guestSessionId);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Add an item to the shopping cart' })
  @ResponseMessage('Item added to cart')
  async addItem(
    @Body() dto: AddToCartDto,
    @CurrentUser('userId') userId?: string,
    @Headers('x-guest-session-id') guestHeader?: string,
  ) {
    if (!dto.guestSessionId && guestHeader) {
      dto.guestSessionId = guestHeader;
    }
    return this.cartService.addItem(dto, userId);
  }

  @Public()
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ResponseMessage('Cart item quantity updated')
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser('userId') userId?: string,
    @Headers('x-guest-session-id') guestHeader?: string,
  ) {
    if (!dto.guestSessionId && guestHeader) {
      dto.guestSessionId = guestHeader;
    }
    return this.cartService.updateItemQuantity(itemId, dto, userId);
  }

  @Public()
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from cart' })
  @ResponseMessage('Item removed from cart')
  async removeItem(
    @Param('itemId') itemId: string,
    @CurrentUser('userId') userId?: string,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    return this.cartService.removeItem(itemId, userId, guestSessionId);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ResponseMessage('Cart cleared')
  async clearCart(
    @CurrentUser('userId') userId?: string,
    @Headers('x-guest-session-id') guestSessionId?: string,
  ) {
    return this.cartService.clearCart(userId, guestSessionId);
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync guest cart items into authenticated user cart' })
  @ResponseMessage('Guest cart synchronized with user cart')
  async syncGuestCart(
    @CurrentUser('userId') userId: string,
    @Body() dto: SyncGuestCartDto,
  ) {
    return this.cartService.syncGuestCart(userId, dto);
  }
}

