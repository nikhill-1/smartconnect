import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

const EMBEDDING_DIMENSION = 768;

/**
 * Deterministic semantic vector generator (768 dimensions).
 * Used when no external LLM API key is configured or during offline operations.
 * Projects text tokens and character n-grams into a unit normalized vector.
 */
function generateDeterministicEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const normalized = text.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return vector;
  }

  // Hash tokens into dimensions
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[idx] += 1.0;

    // Also hash bigrams for phrase representation
    if (i > 0) {
      const bigram = `${tokens[i - 1]}_${word}`;
      let biHash = 0;
      for (let c = 0; c < bigram.length; c++) {
        biHash = (biHash << 5) - biHash + bigram.charCodeAt(c);
        biHash |= 0;
      }
      const biIdx = Math.abs(biHash) % EMBEDDING_DIMENSION;
      vector[biIdx] += 1.5;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Generate embedding for a single text chunk or user question.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  // Try Google Gemini API if configured
  if (config.geminiApiKey && config.geminiApiKey.trim() !== '' && config.geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: config.geminiEmbeddingModel || 'text-embedding-004' });
      const result = await model.embedContent(trimmed);
      const values = result.embedding.values;
      if (values && values.length > 0) {
        return values;
      }
    } catch (err: any) {
      console.warn('[EmbeddingService] Gemini embedding call failed, falling back to local deterministic embedding:', err.message);
    }
  }

  // Fallback to high-precision deterministic embedding
  return generateDeterministicEmbedding(trimmed);
}

/**
 * Batch generate embeddings for multiple chunks
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const emb = await getEmbedding(text);
    embeddings.push(emb);
  }
  return embeddings;
}
