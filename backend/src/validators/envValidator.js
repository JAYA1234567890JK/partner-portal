const { z } = require('zod');

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default(''),
  DATABASE_URL: z.string().default(''),
  DIRECT_URL: z.string().default(''),
  JWT_SECRET: z.string().default(''),
  JWT_EXPIRES_IN: z.string().default('15m'),
  COOKIE_DOMAIN: z.string().default(''),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
});

function validateEnvironment(environment = process.env) {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  const config = result.data;
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    throw new Error('Invalid environment configuration: JWT_SECRET must contain at least 32 characters in production.');
  }
  if (config.NODE_ENV !== 'test' && config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    throw new Error('Invalid environment configuration: JWT_SECRET must contain at least 32 characters.');
  }
  return config;
}

module.exports = { validateEnvironment };
