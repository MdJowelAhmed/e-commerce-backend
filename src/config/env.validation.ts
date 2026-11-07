import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('api/v1'),
  APP_NAME: z.string().default('Luxe Luxury eCommerce API'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().default('luxe_ecommerce'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  COOKIE_SECRET: z.string().default('luxe_cookie_signing_secret'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  THROTTLE_TTL: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(100),

  // Payment adapters
  SSLCOMMERZ_STORE_ID: z.string().optional().default('luxe_test_store'),
  SSLCOMMERZ_STORE_PASSWD: z.string().optional().default('luxe_test_passwd'),
  SSLCOMMERZ_IS_LIVE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SSLCOMMERZ_SUCCESS_URL: z.string().optional().default('http://localhost:3000/checkout/success'),
  SSLCOMMERZ_FAIL_URL: z.string().optional().default('http://localhost:3000/checkout/fail'),
  SSLCOMMERZ_CANCEL_URL: z.string().optional().default('http://localhost:3000/checkout/cancel'),
  SSLCOMMERZ_IPN_URL: z.string().optional().default('http://localhost:5000/api/v1/payments/webhook/sslcommerz'),

  BKASH_APP_KEY: z.string().optional().default('bkash_mock_key'),
  BKASH_APP_SECRET: z.string().optional().default('bkash_mock_secret'),
  BKASH_USERNAME: z.string().optional().default('bkash_mock_user'),
  BKASH_PASSWORD: z.string().optional().default('bkash_mock_pass'),
  BKASH_IS_SANDBOX: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),

  NAGAD_MERCHANT_ID: z.string().optional().default('nagad_mock_id'),
  NAGAD_PUBLIC_KEY: z.string().optional().default('nagad_mock_pub'),
  NAGAD_PRIVATE_KEY: z.string().optional().default('nagad_mock_priv'),

  // AI
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return result.data;
}

