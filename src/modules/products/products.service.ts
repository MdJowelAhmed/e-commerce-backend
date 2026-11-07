import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductQueryDto,
} from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async findAll(queryDto: FilterProductQueryDto) {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
      featured,
    } = queryDto;

    const filter: Record<string, any> = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (brand) {
      filter.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== undefined) filter.basePrice.$gte = minPrice;
      if (maxPrice !== undefined) filter.basePrice.$lte = maxPrice;
    }

    // Sort strategy
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortOptions = { basePrice: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { basePrice: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug: slug.toLowerCase(), isActive: true })
      .lean();

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid product ID format`);
    }

    const product = await this.productModel.findById(id).lean();
    if (!product) {
      throw new NotFoundException(`Product not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.productModel.findOne({
      $or: [{ slug: dto.slug.toLowerCase() }, { sku: dto.sku.toUpperCase() }],
    });

    if (existing) {
      throw new ConflictException('Product with this slug or SKU already exists');
    }

    const newProduct = new this.productModel(dto);
    return await newProduct.save();
  }

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.productModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException(`Product not found`);
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.productModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Product not found`);
    }
    return { deleted: true };
  }

  async getCategories() {
    return this.productModel.distinct('category', { isActive: true });
  }

  async getBrands() {
    return this.productModel.distinct('brand', { isActive: true });
  }

  /**
   * Atomic stock reservation & deduction within a transaction session
   */
  async deductVariantStock(
    productId: Types.ObjectId | string,
    variantSku: string,
    quantity: number,
    session: ClientSession | null,
  ) {
    const options = session ? { session } : {};

    // Find the product and verify stock of the specific variant size
    const product = await this.productModel.findById(productId, null, options);
    if (!product) {
      throw new NotFoundException(`Product not found for ID: ${productId}`);
    }

    let found = false;
    for (const variant of product.variants) {
      for (const size of variant.sizes) {
        if (size.sku === variantSku) {
          if (size.stock < quantity) {
            throw new BadRequestException(
              `Insufficient stock for item "${product.title}" (${size.label}). Available: ${size.stock}, Requested: ${quantity}`,
            );
          }
          size.stock -= quantity;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new NotFoundException(
        `Variant SKU "${variantSku}" was not found on product "${product.title}"`,
      );
    }

    await product.save(options);
    return product;
  }
}

