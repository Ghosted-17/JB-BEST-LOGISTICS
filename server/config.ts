import 'dotenv/config';

const required = (name: string, fallback?: string) => {
  const value = process.env[name] || fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`);
  }
  return value || '';
};

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/jb_best_logistics'),
  jwtSecret: required('JWT_SECRET', 'development-only-change-me'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || '',
  redisUrl: process.env.REDIS_URL || '',
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || '',
    region: process.env.STORAGE_REGION || 'auto',
    bucket: process.env.STORAGE_BUCKET || '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
  },
};
