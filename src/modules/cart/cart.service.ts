import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '@modules/products/schemas/product.schema';
import { AddToCartDto, UpdateCartItemDto, SyncGuestCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  private async getOrCreateCart(userId?: string, guestSessionId?: string) {
    if (!userId && !guestSessionId) {
      throw new BadRequestException('Either userId or guestSessionId must be provided');
    }

    const query: Record<string, any> = {};
    if (userId) {
      query.user = new Types.ObjectId(userId);
    } else {
      query.guestSessionId = guestSessionId;
    }

    let cart = await this.cartModel.findOne(query);
    if (!cart) {
      cart = new this.cartModel({
        user: userId ? new Types.ObjectId(userId) : null,
        guestSessionId: userId ? null : guestSessionId,
        items: [],
      });
      await cart.save();
    }

    return cart;
  }

  async getCart(userId?: string, guestSessionId?: string) {
    const cart = await this.getOrCreateCart(userId, guestSessionId);
    return this.enrichCart(cart);
  }

  async addItem(dto: AddToCartDto, userId?: string) {
    const cart = await this.getOrCreateCart(userId, dto.guestSessionId);

    const product = await this.productModel.findById(dto.productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Verify variant and stock
    let unitPrice = product.basePrice;
    let foundVariant = false;

    for (const v of product.variants) {
      for (const s of v.sizes) {
        if (s.sku === dto.variantSku) {
          if (s.stock < dto.quantity) {
            throw new BadRequestException(
              `Only ${s.stock} item(s) available in stock for selected size`,
            );
          }
          unitPrice += s.priceAdjustment || 0;
          foundVariant = true;
          break;
        }
      }
      if (foundVariant) break;
    }

    if (!foundVariant) {
      throw new NotFoundException(`Variant SKU ${dto.variantSku} not found on this product`);
    }

    const existingIndex = cart.items.findIndex((item) => item.variantSku === dto.variantSku);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += dto.quantity;
      cart.items[existingIndex].unitPrice = unitPrice;
    } else {
      cart.items.push({
        _id: new Types.ObjectId(),
        product: new Types.ObjectId(dto.productId),
        variantSku: dto.variantSku,
        colorName: dto.colorName,
        sizeLabel: dto.sizeLabel,
        quantity: dto.quantity,
        unitPrice,
      } as any);
    }

    await cart.save();
    return this.enrichCart(cart);
  }

  async updateItemQuantity(
    itemId: string,
    dto: UpdateCartItemDto,
    userId?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, dto.guestSessionId);

    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await cart.save();
    return this.enrichCart(cart);
  }

  async removeItem(itemId: string, userId?: string, guestSessionId?: string) {
    const cart = await this.getOrCreateCart(userId, guestSessionId);

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();
    return this.enrichCart(cart);
  }

  async clearCart(userId?: string, guestSessionId?: string) {
    const cart = await this.getOrCreateCart(userId, guestSessionId);
    cart.items = [];
    cart.appliedCoupon = null;
    await cart.save();
    return { success: true, items: [] };
  }

  /**
   * Sync guest items into logged-in user cart
   */
  async syncGuestCart(userId: string, dto: SyncGuestCartDto) {
    const userCart = await this.getOrCreateCart(userId);

    for (const incoming of dto.items) {
      const existing = userCart.items.find((i) => i.variantSku === incoming.variantSku);
      if (existing) {
        existing.quantity += incoming.quantity;
      } else {
        const product = await this.productModel.findById(incoming.productId);
        if (product) {
          userCart.items.push({
            _id: new Types.ObjectId(),
            product: new Types.ObjectId(incoming.productId),
            variantSku: incoming.variantSku,
            colorName: incoming.colorName,
            sizeLabel: incoming.sizeLabel,
            quantity: incoming.quantity,
            unitPrice: product.basePrice,
          } as any);
        }
      }
    }

    // Delete guest cart if guestSessionId was passed
    if (dto.guestSessionId) {
      await this.cartModel.deleteOne({ guestSessionId: dto.guestSessionId });
    }

    await userCart.save();
    return this.enrichCart(userCart);
  }

  private async enrichCart(cart: CartDocument) {
    const populated = await this.cartModel
      .findById(cart._id)
      .populate('items.product', 'title slug basePrice brand variants')
      .lean();

    if (!populated) return null;

    let subtotal = 0;
    const enrichedItems = populated.items.map((item: any) => {
      const itemSubtotal = (item.unitPrice || 0) * item.quantity;
      subtotal += itemSubtotal;
      return {
        ...item,
        subtotal: itemSubtotal,
      };
    });

    return {
      _id: populated._id,
      items: enrichedItems,
      subtotal,
      itemCount: enrichedItems.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
      appliedCoupon: populated.appliedCoupon,
    };
  }
}

