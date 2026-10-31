import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;
let isPgConnected = false;
let isPgVectorAvailable = false;

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('The database is not connected. Start PostgreSQL and restart the server.');
    this.name = 'DatabaseUnavailableError';
  }
}

function readSchemaFile(): string | null {
  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../../src/db/schema.sql'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }
  return null;
}

export async function initDatabase(): Promise<{ connected: boolean; pgvector: boolean }> {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    isPgConnected = true;
    console.log('[Database] Connected to PostgreSQL successfully.');

    const schemaSql = readSchemaFile();
    if (schemaSql) {
      try {
        await client.query(schemaSql);
        console.log('[Database] Schema verified/created successfully.');
      } catch (schemaErr: any) {
        console.error('[Database] Schema execution failed:', schemaErr.message);
      }
    } else {
      console.error('[Database] schema.sql was not found; tables were not created.');
    }

    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await client.query(
        `ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(${config.geminiEmbeddingDimensions});`
      );
      await client.query('DROP INDEX IF EXISTS document_chunks_embedding_cosine_idx;');
      await client.query(
        'CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);'
      );
      isPgVectorAvailable = true;
      console.log('[Database] pgvector extension initialized.');
    } catch (extErr: any) {
      isPgVectorAvailable = false;
      console.warn('[Database] pgvector is not available. Using application-level cosine similarity:', extErr.message);
    }

    client.release();
    return { connected: true, pgvector: isPgVectorAvailable };
  } catch (err: any) {
    isPgConnected = false;
    isPgVectorAvailable = false;
    console.warn('[Database] PostgreSQL connection failed (' + err.message + '). Circulars and student features are unavailable until the database is connected.');
    return { connected: false, pgvector: false };
  }
}

export function getPool(): Pool | null {
  return pool;
}

export function requirePool(): Pool {
  if (!pool || !isPgConnected) {
    throw new DatabaseUnavailableError();
  }
  return pool;
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await requirePool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function getSetting(key: string): Promise<string | null> {
  if (!pool || !isPgConnected) return null;
  const res = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
  return res.rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (!pool || !isPgConnected) return;
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

export function getDatabaseStatus() {
  return {
    connected: isPgConnected,
    pgvector: isPgVectorAvailable,
    database: isPgConnected ? config.pgDatabase : 'in-memory-vector-store',
  };
}
