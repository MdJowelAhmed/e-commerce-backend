import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('LuxeBootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 5000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const frontendUrl = configService.get<string>('frontendUrl') || 'http://localhost:3000';
  const cookieSecret = configService.get<string>('cookie.secret');

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allows Swagger UI to render assets cleanly
    }),
  );

  // 2. Cookie Parser with Secret
  app.use(cookieParser(cookieSecret));

  // 3. Strict CORS Configuration for Frontend decoupling
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://luxe-atelier.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-guest-session-id',
      'x-user-id',
    ],
  });

  // 4. Global API Versioning Prefix
  app.setGlobalPrefix(apiPrefix);

  // 5. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 6. Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // 7. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Luxe Luxury eCommerce API')
    .setDescription(
      'Enterprise-grade REST API backend for Luxe modern luxury fashion platform. ' +
        'Features multi-variant inventory, ACID MongoDB order transactions, ' +
        'RBAC authorization, multi-gateway payments (SSLCommerz, bKash, Nagad, COD), ' +
        'and Google Gemini 1.5 Flash AI concierge integration.',
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'Customer registration, secure login, cookie-based token rotation & logout')
    .addTag('Users', 'User profile and shipping address book management')
    .addTag('Products', 'Luxury apparel catalog, multi-variant schemas & category search')
    .addTag('Cart', 'Persistent and guest session shopping cart')
    .addTag('Orders', 'Checkout, ACID stock deduction & parcel tracking')
    .addTag('Payments', 'Payment adapters & instant payment notification (IPN) webhooks')
    .addTag('Coupons', 'Promo discount codes & validation rules')
    .addTag('Reviews', 'Verified buyer ratings and reviews')
    .addTag('AI Concierge & Styling', 'Gemini AI grounded chat, natural language search & outfit recommendations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Bearer access token',
        in: 'header',
      },
      'bearer-jwt',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'HttpOnly access token cookie',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Luxe API Documentation',
  });

  // Also make available at /api/docs
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(` LUXE BACKEND API RUNNING SUCCESSFULLY`);
  logger.log(` Local Server:   http://localhost:${port}/${apiPrefix}`);
  logger.log(` Swagger Docs:   http://localhost:${port}/docs`);
  logger.log(` CORS Allowed:   ${frontendUrl}`);
  logger.log(` Environment:    ${configService.get<string>('env')}`);
  logger.log(`=======================================================`);
}

bootstrap().catch((err) => {
  new Logger('BootstrapError').error('Failed to initialize application', err.stack);
  process.exit(1);
});

