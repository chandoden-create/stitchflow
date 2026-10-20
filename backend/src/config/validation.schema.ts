import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().allow('', null).optional().default(''),

  JWT_SECRET: Joi.string().allow('', null).optional().default('stitchflow-super-secret-jwt-key-replace-in-production-min-32-chars'),
  JWT_EXPIRES_IN: Joi.string().allow('', null).optional().default('7d'),

  REDIS_HOST: Joi.string().allow('', null).optional().default('localhost'),
  REDIS_PORT: Joi.number().optional().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null).optional(),

  S3_ENDPOINT: Joi.string().allow('', null).optional(),
  S3_REGION: Joi.string().allow('', null).optional().default('us-east-1'),
  S3_ACCESS_KEY: Joi.string().allow('', null).optional().default('minioadmin'),
  S3_SECRET_KEY: Joi.string().allow('', null).optional().default('minioadmin'),
  S3_BUCKET: Joi.string().allow('', null).optional().default('stitchflow-photos'),
  S3_FORCE_PATH_STYLE: Joi.string().allow('', null).valid('true', 'false').default('false'),

  WHATSAPP_SANDBOX_MODE: Joi.string().allow('', null).optional().default('true'),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().allow('', null).optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().allow('', null).optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().allow('', null).optional(),
  WHATSAPP_VERIFY_TOKEN: Joi.string().allow('', null).optional().default('stitchflow-webhook-verify'),
  WHATSAPP_API_VERSION: Joi.string().allow('', null).optional().default('v19.0'),

  THROTTLE_TTL: Joi.number().optional().default(60),
  THROTTLE_LIMIT: Joi.number().optional().default(60),
});

export const envValidationSchema = validationSchema;
