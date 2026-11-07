import { connect, disconnect, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxe_ecommerce';

async function seedDatabase() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
  const conn = await connect(MONGODB_URI);
  const db = conn.connection.db;

  if (!db) {
    throw new Error('Database connection failed');
  }

  console.log('Clearing existing collections...');
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  if (collectionNames.includes('users')) await db.collection('users').deleteMany({});
  if (collectionNames.includes('products')) await db.collection('products').deleteMany({});
  if (collectionNames.includes('coupons')) await db.collection('coupons').deleteMany({});
  if (collectionNames.includes('orders')) await db.collection('orders').deleteMany({});
  if (collectionNames.includes('reviews')) await db.collection('reviews').deleteMany({});
  if (collectionNames.includes('carts')) await db.collection('carts').deleteMany({});

  console.log('Seeding administrative and customer users...');
  const adminSalt = await bcrypt.genSalt(12);
  const adminPassword = await bcrypt.hash('LuxeAdmin#2026', adminSalt);
  const customerPassword = await bcrypt.hash('LuxeCustomer#2026', adminSalt);

  const adminId = new Types.ObjectId();
  const customerId = new Types.ObjectId();

  await db.collection('users').insertMany([
    {
      _id: adminId,
      name: 'Luxe Head Atelier',
      email: 'admin@luxe-atelier.com',
      password: adminPassword,
      roles: ['admin', 'manager', 'customer'],
      isEmailVerified: true,
      phone: '+8801711000001',
      addresses: [
        {
          _id: new Types.ObjectId(),
          label: 'Flagship Atelier',
          recipientName: 'Luxe Concierge',
          phone: '+8801711000001',
          street: 'Avenue 2, Block D, Gulshan-2',
          city: 'Dhaka',
          postalCode: '1212',
          country: 'Bangladesh',
          isDhakaCity: true,
          isDefault: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: customerId,
      name: 'Sheikh Tariq Al-Amin',
      email: 'customer@luxe-atelier.com',
      password: customerPassword,
      roles: ['customer'],
      isEmailVerified: true,
      phone: '+8801711000002',
      addresses: [
        {
          _id: new Types.ObjectId(),
          label: 'Residence',
          recipientName: 'Sheikh Tariq',
          phone: '+8801711000002',
          street: 'Road 84, House 12, Gulshan-2',
          city: 'Dhaka',
          postalCode: '1212',
          country: 'Bangladesh',
          isDhakaCity: true,
          isDefault: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('Seeding luxury promo coupons...');
  await db.collection('coupons').insertMany([
    {
      _id: new Types.ObjectId(),
      code: 'LUXE15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumOrderAmount: 10000,
      maxDiscountCap: 5000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 500,
      usedCount: 14,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      code: 'WELCOME500',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500,
      minimumOrderAmount: 5000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2027-12-31'),
      usageLimit: 1000,
      usedCount: 42,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('Seeding luxury catalog products with multi-variant modeling...');
  const products = [
    {
      _id: new Types.ObjectId(),
      title: 'Vicuna & Mongolian Cashmere Double-Breasted Overcoat',
      slug: 'vicuna-mongolian-cashmere-overcoat',
      sku: 'LX-COAT-001',
      brand: 'Luxe Atelier Bespoke',
      category: 'Outerwear',
      description:
        'A masterpiece of outerwear craftsmanship. Tailored in Biella from 90% unbleached Mongolian cashmere and 10% rare Peruvian vicuna. Features horn buttons, cupro lining, and hand-stitched peak lapels.',
      materials: ['90% Grade-A Mongolian Cashmere', '10% Peruvian Vicuna', '100% Cupro Bemberg Lining'],
      careInstructions: 'Specialist luxury dry clean only. Store on wide cedar hanger.',
      basePrice: 48500,
      comparePrice: 56000,
      tags: ['outerwear', 'cashmere', 'vicuna', 'winter-2026', 'bespoke', 'luxury'],
      isFeatured: true,
      isActive: true,
      rating: 4.9,
      reviewCount: 18,
      attributes: {
        fit: 'Tailored Sartorial Fit',
        season: 'Autumn / Winter',
        origin: 'Made in Biella, Italy',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Camel Melange',
          colorHex: '#C19A6B',
          colorCode: 'CML',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Vicuna Cashmere Overcoat front view in Camel Melange',
              isPrimary: true,
            },
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Vicuna Cashmere Overcoat texture and lapel close-up',
              isPrimary: false,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: '48 (M)', sku: 'LX-COAT-001-CML-48', stock: 6, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '50 (L)', sku: 'LX-COAT-001-CML-50', stock: 8, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '52 (XL)', sku: 'LX-COAT-001-CML-52', stock: 4, priceAdjustment: 1000 },
          ],
        },
        {
          _id: new Types.ObjectId(),
          colorName: 'Midnight Noir',
          colorHex: '#121214',
          colorCode: 'NOIR',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Vicuna Cashmere Overcoat in Midnight Noir',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: '48 (M)', sku: 'LX-COAT-001-NOIR-48', stock: 5, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '50 (L)', sku: 'LX-COAT-001-NOIR-50', stock: 6, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 29,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      title: 'Super 160s Wool Flannel Tuxedo with Grosgrain Lapels',
      slug: 'super-160s-wool-flannel-tuxedo',
      sku: 'LX-SUIT-002',
      brand: 'Luxe Sartoria',
      category: 'Tailoring',
      description:
        'Crafted from legendary Super 160s superfine worsted wool. Features natural horsehair canvas construction, silk grosgrain shawl lapels, and hand-sewn buttonholes. An indispensable black-tie evening statement.',
      materials: ['100% Super 160s Worsted Wool', 'Silk Grosgrain Accents', 'Full Canvas Interlining'],
      careInstructions: 'Dry clean only. Steam gently.',
      basePrice: 65000,
      comparePrice: 75000,
      tags: ['tailoring', 'black-tie', 'suit', 'formal', 'gala', 'bespoke'],
      isFeatured: true,
      isActive: true,
      rating: 5.0,
      reviewCount: 12,
      attributes: {
        fit: 'Neapolitan Cut',
        lapel: 'Silk Grosgrain Shawl',
        season: 'All Season',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Midnight Navy',
          colorHex: '#0A1128',
          colorCode: 'NAVY',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Super 160s Tuxedo Midnight Navy',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: '40R', sku: 'LX-SUIT-002-NAVY-40R', stock: 4, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '42R', sku: 'LX-SUIT-002-NAVY-42R', stock: 7, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '44R', sku: 'LX-SUIT-002-NAVY-44R', stock: 3, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 14,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      title: 'Hand-Woven Mulberry Silk Jacquard Evening Shirt',
      slug: 'mulberry-silk-jacquard-shirt',
      sku: 'LX-SHIRT-003',
      brand: 'Luxe Sartoria',
      category: 'Shirts',
      description:
        'Woven from 22-momme pure mulberry silk with a subtle geometric jacquard weave. Finished with Australian mother-of-pearl buttons and French double cuffs.',
      materials: ['100% Pure Mulberry Silk', 'Natural Mother-of-Pearl Buttons'],
      careInstructions: 'Delicate hand wash or gentle dry clean. Cool iron on reverse.',
      basePrice: 14500,
      comparePrice: 17000,
      tags: ['shirts', 'silk', 'jacquard', 'formal', 'luxury'],
      isFeatured: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 24,
      attributes: {
        collar: 'Cutaway Collar',
        cuff: 'French Double Cuffs',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Pearlescent Ivory',
          colorHex: '#FDFBF7',
          colorCode: 'IVR',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Silk Jacquard Shirt Ivory',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: '39 (15.5")', sku: 'LX-SHIRT-003-IVR-39', stock: 12, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '41 (16.0")', sku: 'LX-SHIRT-003-IVR-41', stock: 15, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: '43 (17.0")', sku: 'LX-SHIRT-003-IVR-43', stock: 8, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 35,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      title: 'Hand-Burnished Calfskin Oxford Dress Shoes',
      slug: 'calfskin-oxford-dress-shoes',
      sku: 'LX-SHOE-004',
      brand: 'Luxe Calzolaio',
      category: 'Footwear',
      description:
        'Goodyear-welted oxford shoes handcrafted in Northamptonshire from full-grain French box calf leather. Hand-burnished finish with channeled oak-bark tanned leather soles.',
      materials: ['Full-Grain French Calfskin', 'Oak-Bark Tanned Leather Sole', 'Cork Cushion Midsole'],
      careInstructions: 'Condition with beeswax polish regularly. Keep in cedar shoe trees.',
      basePrice: 28000,
      comparePrice: 32500,
      tags: ['footwear', 'oxfords', 'goodyear-welted', 'leather', 'formal'],
      isFeatured: true,
      isActive: true,
      rating: 4.9,
      reviewCount: 15,
      attributes: {
        construction: 'Goodyear Welted',
        last: 'Classic Soft Chisel Last',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Espresso Burnish',
          colorHex: '#3D2817',
          colorCode: 'ESP',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Hand-Burnished Calfskin Oxford Shoes',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: 'EU 41 (UK 7.5)', sku: 'LX-SHOE-004-ESP-41', stock: 5, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: 'EU 42 (UK 8.5)', sku: 'LX-SHOE-004-ESP-42', stock: 9, priceAdjustment: 0 },
            { _id: new Types.ObjectId(), label: 'EU 43 (UK 9.5)', sku: 'LX-SHOE-004-ESP-43', stock: 6, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      title: 'Full-Grain Saddle Leather Weekender Duffle Bag',
      slug: 'full-grain-saddle-leather-weekender',
      sku: 'LX-BAG-005',
      brand: 'Luxe Pelletteria',
      category: 'Leather Goods',
      description:
        'Vegetable-tanned Tuscan saddle leather bag that patinas richly over decades of global travel. Solid brass hardware, reinforced leather handles, and a dedicated shoe compartment.',
      materials: ['Tuscan Vegetable-Tanned Saddle Leather', 'Solid Antiqued Brass Hardware', 'Heavy Cotton Canvas Interior'],
      careInstructions: 'Treat with natural leather balsam once annually.',
      basePrice: 36500,
      comparePrice: 42000,
      tags: ['leather-goods', 'travel', 'duffel', 'accessories', 'luxury'],
      isFeatured: false,
      isActive: true,
      rating: 5.0,
      reviewCount: 9,
      attributes: {
        dimensions: '52cm x 28cm x 26cm',
        capacity: '42 Liters',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Cognac Amber',
          colorHex: '#8C4820',
          colorCode: 'CGN',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Saddle Leather Weekender Duffle in Cognac',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: 'One Size (42L)', sku: 'LX-BAG-005-CGN-OS', stock: 11, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 11,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: new Types.ObjectId(),
      title: 'Automatic Chronometer Watch with Louisiana Alligator Strap',
      slug: 'automatic-chronometer-alligator-watch',
      sku: 'LX-TIME-006',
      brand: 'Luxe Horlogerie',
      category: 'Accessories',
      description:
        'Swiss-certified COSC chronometer with 70-hour power reserve. Domed anti-reflective sapphire crystal, enamel dial, blued Breguet hands, and hand-stitched Louisiana alligator leather strap.',
      materials: ['316L Stainless Steel', 'Double Sapphire Crystal', 'Louisiana Alligator Leather'],
      careInstructions: 'Water resistant to 50m. Service movement every 5 years.',
      basePrice: 85000,
      comparePrice: 98000,
      tags: ['accessories', 'watch', 'horology', 'swiss', 'luxury'],
      isFeatured: true,
      isActive: true,
      rating: 5.0,
      reviewCount: 7,
      attributes: {
        caseDiameter: '40 mm',
        movement: 'Calibre LX-701 Automatic COSC',
      },
      variants: [
        {
          _id: new Types.ObjectId(),
          colorName: 'Silver Dial / Black Strap',
          colorHex: '#E5E5E5',
          colorCode: 'SLV',
          images: [
            {
              _id: new Types.ObjectId(),
              url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop',
              altText: 'Luxe Automatic Chronometer with Alligator Strap',
              isPrimary: true,
            },
          ],
          sizes: [
            { _id: new Types.ObjectId(), label: '40mm', sku: 'LX-TIME-006-SLV-40', stock: 5, priceAdjustment: 0 },
          ],
        },
      ],
      totalStock: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.collection('products').insertMany(products);

  console.log('Seeding sample completed order and verified review...');
  const sampleProduct = products[0];
  const orderId = new Types.ObjectId();
  const orderNumber = 'LX-20261101-1001';

  await db.collection('orders').insertOne({
    _id: orderId,
    orderNumber,
    user: customerId,
    guestEmail: null,
    items: [
      {
        product: sampleProduct._id,
        title: sampleProduct.title,
        sku: 'LX-COAT-001-CML-48',
        color: 'Camel Melange',
        size: '48 (M)',
        price: 48500,
        quantity: 1,
        subtotal: 48500,
        image: sampleProduct.variants[0].images[0].url,
      },
    ],
    subtotal: 48500,
    discount: 5000,
    couponCode: 'LUXE15',
    shippingFee: 0, // Free shipping for >= 5000
    totalAmount: 43500,
    shippingAddress: {
      recipientName: 'Sheikh Tariq',
      phone: '+8801711000002',
      street: 'Road 84, House 12, Gulshan-2',
      city: 'Dhaka',
      postalCode: '1212',
      country: 'Bangladesh',
      isDhakaCity: true,
    },
    paymentInfo: {
      method: 'SSLCOMMERZ',
      status: 'PAID',
      transactionId: 'SSL_TRX_9482910',
      paidAt: new Date('2026-11-01T14:30:00Z'),
    },
    orderStatus: 'DELIVERED',
    courierTrackingNumber: 'DHL-8472918',
    courierName: 'DHL Luxe Express',
    timeline: [
      { status: 'PENDING', note: 'Order placed', timestamp: new Date('2026-11-01T14:00:00Z') },
      { status: 'PROCESSING', note: 'Payment verified and item bespoke-packed', timestamp: new Date('2026-11-01T15:00:00Z') },
      { status: 'SHIPPED', note: 'Dispatched with courier', timestamp: new Date('2026-11-02T10:00:00Z') },
      { status: 'DELIVERED', note: 'Successfully delivered to residence', timestamp: new Date('2026-11-03T16:00:00Z') },
    ],
    createdAt: new Date('2026-11-01T14:00:00Z'),
    updatedAt: new Date('2026-11-03T16:00:00Z'),
  });

  await db.collection('reviews').insertOne({
    _id: new Types.ObjectId(),
    product: sampleProduct._id,
    user: customerId,
    rating: 5,
    title: 'The pinnacle of luxury cashmere',
    comment:
      'Impeccable drape, featherlight warmth, and the hand-feel of Peruvian vicuna is unmatched. Delivered inside Dhaka in signature luxury presentation box with cedar hanger.',
    isVerifiedBuyer: true,
    photos: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop',
    ],
    isApproved: true,
    createdAt: new Date('2026-11-04T10:00:00Z'),
    updatedAt: new Date('2026-11-04T10:00:00Z'),
  });

  console.log('Database seeding successfully finished!');
  console.log(`- Admin Account:    admin@luxe-atelier.com (Pass: LuxeAdmin#2026)`);
  console.log(`- Customer Account: customer@luxe-atelier.com (Pass: LuxeCustomer#2026)`);
  console.log(`- Products Seeded:  ${products.length} luxury items`);
  console.log(`- Coupons Seeded:   LUXE15, WELCOME500`);
  console.log(`- Orders Seeded:    ${orderNumber} (DELIVERED with verified review)`);

  await disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

