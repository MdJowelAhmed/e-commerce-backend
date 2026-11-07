import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from '@modules/products/schemas/product.schema';
import { Order, OrderDocument, OrderStatus } from '@modules/orders/schemas/order.schema';
import { CreateReviewDto } from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto) {
    const product = await this.productModel.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingReview = await this.reviewModel.findOne({
      product: new Types.ObjectId(dto.productId),
      user: new Types.ObjectId(userId),
    });

    if (existingReview) {
      throw new ConflictException('You have already submitted a review for this product');
    }

    // Check Verified Buyer status: user has an order with status DELIVERED containing this product
    const deliveredOrder = await this.orderModel.findOne({
      user: new Types.ObjectId(userId),
      orderStatus: OrderStatus.DELIVERED,
      'items.product': new Types.ObjectId(dto.productId),
    });

    const isVerifiedBuyer = !!deliveredOrder;

    const review = new this.reviewModel({
      product: new Types.ObjectId(dto.productId),
      user: new Types.ObjectId(userId),
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      photos: dto.photos || [],
      isVerifiedBuyer,
    });

    await review.save();

    // Recalculate average rating & review count for the product
    await this.updateProductRatingStats(dto.productId);

    return review;
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { product: new Types.ObjectId(productId), isApproved: true };

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async updateProductRatingStats(productId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { product: new Types.ObjectId(productId), isApproved: true } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await this.productModel.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        reviewCount: stats[0].count,
      });
    }
  }
}

