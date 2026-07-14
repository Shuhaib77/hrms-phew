import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  companyName: process.env.COMPANY_NAME || 'Phew HRMS',
  cloudinary: {
    cloudName: process.env.CLOUD_NAME || '',
    apiKey: process.env.CLOUD_API || '',
    apiSecret: process.env.CLOUD_SECRET || '',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/phew_hrms',
  },
  rateLimit: {
    auth: { window: 15 * 60 * 1000, max: 50 },
    attendance: { window: 60 * 1000, max: 30 },
    general: { window: 15 * 60 * 1000, max: 1000 },
    upload: { window: 60 * 1000, max: 5 },
  },
  bcryptRounds: 12,
  uploadLimits: {
    fileSize: 5 * 1024 * 1024,
    imageMaxDimension: 1024,
  },
};

const required = ['JWT_SECRET', 'DATABASE_URL', 'CLOUD_NAME', 'CLOUD_API', 'CLOUD_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
