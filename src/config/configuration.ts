export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appName: process.env.APP_NAME || 'Luxe Luxury eCommerce API',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/luxe_ecommerce',
    dbName: process.env.MONGODB_DB_NAME || 'luxe_ecommerce',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'luxe_super_secret_access_key',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'luxe_super_secret_refresh_key',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  cookie: {
    secret: process.env.COOKIE_SECRET || 'luxe_cookie_signing_secret',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
  },

  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  payments: {
    sslcommerz: {
      storeId: process.env.SSLCOMMERZ_STORE_ID || '',
      storePasswd: process.env.SSLCOMMERZ_STORE_PASSWD || '',
      isLive: process.env.SSLCOMMERZ_IS_LIVE === 'true',
      successUrl: process.env.SSLCOMMERZ_SUCCESS_URL || '',
      failUrl: process.env.SSLCOMMERZ_FAIL_URL || '',
      cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL || '',
      ipnUrl: process.env.SSLCOMMERZ_IPN_URL || '',
    },
    bkash: {
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
      isSandbox: process.env.BKASH_IS_SANDBOX !== 'false',
    },
    nagad: {
      merchantId: process.env.NAGAD_MERCHANT_ID || '',
      publicKey: process.env.NAGAD_PUBLIC_KEY || '',
      privateKey: process.env.NAGAD_PRIVATE_KEY || '',
    },
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
});

