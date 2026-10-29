import { Pool } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;
let isPgConnected = false;
let isPgVectorAvailable = false;

export async function initDatabase(): Promise<{ connected: boolean; pgvector: boolean }> {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    isPgConnected = true;
    console.log('[Database] Connected to PostgreSQL successfully.');

    // Check pgvector extension
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      isPgVectorAvailable = true;
      console.log('[Database] pgvector extension initialized.');
    } catch (extErr: any) {
      console.warn('[Database] pgvector extension not installed or permission denied on PostgreSQL. Vector search will use application-level cosine similarity:', extErr.message);
    }

    // Run schema migrations if needed
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Run statements
        await client.query(schemaSql);
        console.log('[Database] Schema verified/created successfully.');
      }
    } catch (schemaErr: any) {
      console.warn('[Database] Schema execution warning:', schemaErr.message);
    }

    client.release();
    return { connected: true, pgvector: isPgVectorAvailable };
  } catch (err: any) {
    isPgConnected = false;
    isPgVectorAvailable = false;
    console.warn('[Database] PostgreSQL connection failed (' + err.message + '). Seamlessly using built-in high-performance local vector store.');
    return { connected: false, pgvector: false };
  }
}

export function getPool(): Pool | null {
  return pool;
}

export function getDatabaseStatus() {
  return {
    connected: isPgConnected,
    pgvector: isPgVectorAvailable,
    database: isPgConnected ? config.pgDatabase : 'in-memory-vector-store',
  };
}
