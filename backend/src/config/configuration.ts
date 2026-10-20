export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY ?? '',
    secretKey: process.env.S3_SECRET_KEY ?? '',
    bucket: process.env.S3_BUCKET ?? 'stitchflow-photos',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || !!process.env.S3_ENDPOINT,
  },

  whatsapp: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? 'stitchflow-webhook-verify',
    graphApiVersion: process.env.WHATSAPP_API_VERSION ?? 'v19.0',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
  },
});
