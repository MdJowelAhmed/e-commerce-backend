# Luxe — Modern Luxury eCommerce Backend API

[![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Queues-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Enterprise-grade, decoupled backend REST API and background service layer engineered for **Luxe**, a contemporary luxury fashion atelier platform. Built with **NestJS (v10+)**, **MongoDB with Mongoose**, **Redis**, **Passport JWT with HttpOnly cookie token rotation**, **ACID Transactions**, **Multi-Gateway Payment Adapters**, and **Google Gemini 1.5 Flash AI Concierge**.

---

## 🏛 Architecture Overview

```
src/
├── common/                     # Cross-cutting enterprise layer
│   ├── decorators/             # @CurrentUser(), @Roles(), @Public(), @ResponseMessage()
│   ├── filters/                # AllExceptionsFilter (Standard response envelope)
│   ├── guards/                 # JwtAuthGuard, RolesGuard, ThrottlerGuard
│   ├── interceptors/           # TransformInterceptor, LoggingInterceptor
│   ├── interfaces/             # Unified API response and pagination interfaces
│   └── pipes/                  # ParseObjectIdPipe
├── config/                     # Configuration schema & runtime validation via Zod
│   ├── configuration.ts        # Typed configuration factory
│   └── env.validation.ts       # Zod environment validator
├── database/                   # Database connection, transactions & seeds
│   ├── database.module.ts      # MongooseModule configuration
│   ├── transaction.helper.ts   # MongoDB ACID Transaction helper with graceful fallback
│   └── seed.ts                 # Realistic luxury seed script
└── modules/                    # Domain-Driven Feature Modules
    ├── auth/                   # Register, login, cookie rotation, logout, JWT strategy
    ├── users/                  # User profile, multi-address book & RBAC
    ├── products/               # Multi-variant modeling, categories, brands, inventory
    ├── cart/                   # Guest session cart sync & authenticated persistent cart
    ├── orders/                 # Checkout, ACID stock deduction, lifecycle tracking
    ├── payments/               # Adapter pattern (SSLCommerz, bKash, Nagad, COD) & webhooks
    ├── reviews/                # Ratings, customer reviews, verified buyer verification
    ├── coupons/                # Promo discount codes, validation & usage caps
    └── ai/                     # Gemini 1.5 Flash concierge chat, search intent parser, outfit curator
```

---

## 💎 Key Business & Architectural Features

### 1. Multi-Variant Product Schema
- **Colors**: Name, Hex code (`#C19A6B`), color code (`CML`), and dedicated high-res gallery images.
- **Sizes**: Label (`48 (M)`, `50 (L)`), distinct variant SKU (`LX-COAT-001-CML-48`), real-time stock count, and size-specific price adjustments.
- **Pre-save hook**: Automatically computes aggregate `totalStock` across all variants and sizes.
- **Text & Compound Indexes**: Optimized for instant search by brand, category, materials, and tags.

### 2. MongoDB ACID Transactions for Zero Overselling
- Order checkout wraps product stock validation, deduction, coupon redemption, and order creation inside `TransactionHelper.withTransaction()`.
- Guarantees concurrent customers can never oversell limited luxury stock.

### 3. Delivery & Shipping Engine
- ৳80 inside Dhaka (`isDhakaCity: true`)
- ৳150 nationwide outside Dhaka
- **FREE Shipping** automatically applied for orders `subtotal >= ৳5,000`

### 4. Enterprise Security & Authentication
- **Short-Lived Access Token** (15 mins) + **Rotated Refresh Token** (7 days).
- Tokens transmitted via secure **HttpOnly cookies** (`SameSite`, `Secure`) to protect against XSS token theft.
- Refresh tokens hashed with `bcrypt` (10 rounds) in MongoDB. In case of token reuse or replay attacks, the entire user token family is revoked immediately.
- Role-Based Access Control via custom `@Roles('admin', 'customer', 'manager')` and `RolesGuard`.
- Helmet HTTP security headers, CORS origin whitelisting, and `@nestjs/throttler` rate limiting.

### 5. Multi-Payment Adapter Architecture
Decoupled payment engine implementing the Strategy Pattern (`IPaymentAdapter`):
- **SSLCommerz**: Hosted payment gateway checkout with IPN (Instant Payment Notification) validation.
- **bKash**: Direct mobile checkout and transaction callback.
- **Nagad**: Payment session initiation and verification.
- **Cash on Delivery (COD)**: Instant order confirmation without external redirection.

### 6. Google Gemini 1.5 Flash AI Engine
- **POST `/api/v1/ai/chat`**: Sartorial concierge chat grounded in live MongoDB inventory context.
- **GET `/api/v1/ai/search`**: Natural language search intent parser extracting budget ceilings, categories, and seasonal keywords into precise database queries.
- **GET `/api/v1/ai/outfit-generator`**: Curates complementary ensembles (outerwear, tailoring, footwear, accessories) based on anchor items or formal dress codes.

### 7. Unified JSON Response Envelope
Every response and error adheres to a consistent JSON structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  },
  "timestamp": "2026-11-06T06:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (v22+ LTS recommended)
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Start Local MongoDB & Redis
Start MongoDB (with replica set enabled for ACID transactions) and Redis:
```bash
docker compose up -d
```
- MongoDB is available at `localhost:27017`
- Redis is available at `localhost:6379`
- Mongo Express visual UI is available at `http://localhost:8082`
- Redis Commander visual UI is available at `http://localhost:8083`

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` is added to `.env` to enable live Gemini AI concierge features.

### 4. Install Dependencies & Seed Catalog
```bash
npm install
npm run seed
```

Default seeded credentials:
- **Admin**: `admin@luxe-atelier.com` / `LuxeAdmin#2026`
- **Customer**: `customer@luxe-atelier.com` / `LuxeCustomer#2026`

### 5. Start Development Server
```bash
npm run start:dev
```

### 6. Interactive OpenAPI / Swagger Documentation
Once the server is running, navigate to:
👉 **`http://localhost:5000/docs`** (or `http://localhost:5000/api/v1/docs`)
You can test all endpoints, authenticate via Bearer JWT or cookies, and inspect DTO validation schemas.

