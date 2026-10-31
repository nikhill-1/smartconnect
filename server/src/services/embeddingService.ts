import { GoogleGenAI } from '@google/genai';
import { config, isGeminiConfigured } from '../config';

const EMBEDDING_DIMENSION = config.geminiEmbeddingDimensions;

export type EmbeddingKind = 'query' | 'document';

let geminiClient: GoogleGenAI | null = null;
let geminiEmbeddingsEnabled = true;

export function disableGeminiEmbeddings(): void {
  geminiEmbeddingsEnabled = false;
}

export function isGeminiEmbeddingActive(): boolean {
  return isGeminiConfigured() && geminiEmbeddingsEnabled;
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return geminiClient;
}

export function getEmbeddingSignature(): string {
  return isGeminiEmbeddingActive()
    ? `gemini:${config.geminiEmbeddingModel}:${EMBEDDING_DIMENSION}`
    : `local:hash-v1:${EMBEDDING_DIMENSION}`;
}

function generateDeterministicEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const normalized = text.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return vector;
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[idx] += 1.0;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithGemini(text: string, kind: EmbeddingKind, title?: string): Promise<number[]> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini is not configured.');

  const model = config.geminiEmbeddingModel;
  const legacyStyle = model.includes('embedding-001');
  const contents = legacyStyle
    ? text
    : kind === 'query'
      ? `task: search result | query: ${text}`
      : `title: ${title || 'none'} | text: ${text}`;

  const request: any = {
    model,
    contents,
    config: { outputDimensionality: EMBEDDING_DIMENSION },
  };
  if (legacyStyle) {
    request.config.taskType = kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
  }

  let lastError: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await client.models.embedContent(request);
      const values = result.embeddings?.[0]?.values;
      if (!values || values.length === 0) {
        throw new Error('Gemini returned an empty embedding.');
      }
      if (values.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Gemini returned ${values.length} dimensions but ${EMBEDDING_DIMENSION} are expected.`);
      }
      return values;
    } catch (err: any) {
      lastError = err;
      const retriable = /429|500|503|UNAVAILABLE|RESOURCE_EXHAUSTED|fetch failed/i.test(String(err?.message));
      if (!retriable || attempt === 3) break;
      await sleep(600 * attempt);
    }
  }
  throw lastError;
}

export async function getEmbedding(text: string, kind: EmbeddingKind = 'document', title?: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  if (isGeminiEmbeddingActive()) {
    try {
      return await embedWithGemini(trimmed, kind, title);
    } catch (err: any) {
      if (kind === 'query') {
        console.warn('[EmbeddingService] Gemini query embedding failed; using keyword search only:', err.message);
        return [];
      }
      console.warn('[EmbeddingService] Gemini document embedding failed, falling back to deterministic embedding:', err.message);
      return generateDeterministicEmbedding(trimmed);
    }
  }

  return generateDeterministicEmbedding(trimmed);
}

export async function getBatchEmbeddings(texts: string[], title?: string): Promise<number[][]> {
  const embeddings: number[][] = new Array(texts.length);
  const concurrency = isGeminiEmbeddingActive() ? 4 : 32;
  for (let start = 0; start < texts.length; start += concurrency) {
    const slice = texts.slice(start, start + concurrency);
    const results = await Promise.all(slice.map((t) => getEmbedding(t, 'document', title)));
    results.forEach((vector, i) => {
      embeddings[start + i] = vector;
    });
  }
  return embeddings;
}
