import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../db/connection';
import { getChunkCount } from '../db/vectorStore';
import { config } from '../config';
import { getGeminiStatus } from '../services/llmService';
import { getEmbeddingSignature } from '../services/embeddingService';

export const healthRouter = Router();

/**
 * GET /api/health
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const chunkCount = getChunkCount();
  const gemini = getGeminiStatus();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SmartConnect College Information System',
    version: '1.0.0',
    database: {
      connected: dbStatus.connected,
      type: dbStatus.database,
      pgvectorEnabled: dbStatus.pgvector,
      indexedChunks: chunkCount,
    },
    ai: {
      provider: gemini.configured ? 'Google Gemini (' + config.geminiModel + ')' : 'TRR Grounded Evidence Synthesizer',
      embeddingProvider: gemini.configured ? 'Google Gemini (' + config.geminiEmbeddingModel + ')' : 'Semantic Deterministic Vectorizer',
      embeddingSignature: getEmbeddingSignature(),
      gemini,
    },
  });
});
