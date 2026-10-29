import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to local directory

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartconnect_db',
  pgHost: process.env.PGHOST || 'localhost',
  pgPort: parseInt(process.env.PGPORT || '5432', 10),
  pgDatabase: process.env.PGDATABASE || 'smartconnect_db',
  pgUser: process.env.PGUSER || 'postgres',
  pgPassword: process.env.PGPASSWORD || 'postgres',

  // AI Providers
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',

  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',

  // Authentication & Security
  jwtSecret: process.env.JWT_SECRET || 'trr_smartconnect_jwt_secret_key_change_in_production_2024',
  adminUsername: process.env.ADMIN_USERNAME || '12345',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  adminSessionExpiresIn: process.env.ADMIN_SESSION_EXPIRES_IN || '24h',

  // RAG Configuration
  relevanceThreshold: parseFloat(process.env.RELEVANCE_THRESHOLD || '0.35'),
  topKChunks: parseInt(process.env.TOP_K_CHUNKS || '4', 10),
  maxRequestCharLength: parseInt(process.env.MAX_REQUEST_CHAR_LENGTH || '1000', 10),
  rateLimitMaxPerMinute: parseInt(process.env.RATE_LIMIT_MAX_PER_MINUTE || '60', 10),
};
