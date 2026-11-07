import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductQueryDto,
} from './dto/products.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles, UserRole } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List and filter luxury products with pagination' })
  @ResponseMessage('Products fetched successfully')
  async findAll(@Query() query: FilterProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Retrieve unique product categories' })
  @ResponseMessage('Product categories fetched successfully')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'Retrieve unique luxury brands' })
  @ResponseMessage('Product brands fetched successfully')
  async getBrands() {
    return this.productsService.getBrands();
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Retrieve a single product by unique URL slug' })
  @ResponseMessage('Product details fetched successfully')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single product by ID' })
  @ResponseMessage('Product details fetched successfully')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new luxury product (Admin only)' })
  @ResponseMessage('Product created successfully')
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing product (Admin only)' })
  @ResponseMessage('Product updated successfully')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ResponseMessage('Product removed successfully')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

