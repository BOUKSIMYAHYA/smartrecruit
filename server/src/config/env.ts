import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/smartrecruit_ats?schema=public',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_placeholder',
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder',
  SUPER_ADMIN_EMAILS: (process.env.SUPER_ADMIN_EMAILS || 'yhykk8899@gmail.com,saadtoufik67@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase()),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-1.5-flash',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || 'yhykk8899@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'qaxkzgcvanbqirvv',
  SMTP_FROM: process.env.SMTP_FROM || 'SmartRecruit ATS - ESTC <yhykk8899@gmail.com>',
  SMTP_ENABLED: process.env.SMTP_ENABLED !== 'false',
  STORAGE_PATH: path.resolve(__dirname, '../../storage'),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  ALLOWED_MIME_TYPES: (process.env.ALLOWED_MIME_TYPES || 'application/pdf').split(','),
  JWT_SECRET: process.env.JWT_SECRET || 'smartrecruit_ats_jwt_super_secret_production_key_2026_xyz',
};
