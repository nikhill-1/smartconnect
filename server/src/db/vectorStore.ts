import { getPool, getDatabaseStatus } from './connection';

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  pageNumber?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  sourceType: string;
  sourceReference?: string;
  rawContent?: string;
  accessClassification: 'public' | 'restricted';
  approvalStatus: 'approved' | 'pending';
  version: string;
  status: 'indexed' | 'failed' | 'processing';
  chunkCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface StudentEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseInterest: string;
  message?: string;
  status: 'new' | 'contacted' | 'admitted';
  createdAt: Date;
}

export interface UnansweredQueryLog {
  id: string;
  query: string;
  createdAt: Date;
}

export interface CourseSpreadsheet {
  pin: string;
  courseName: string;
  spreadsheetUrl: string;
}

const memoryDocuments = new Map<string, KnowledgeDocument>();
const memoryChunks = new Map<string, DocumentChunk>();
const memoryEnquiries = new Map<string, StudentEnquiry>();
const memoryUnansweredQueries: UnansweredQueryLog[] = [];

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function saveDocument(doc: KnowledgeDocument): Promise<void> {
  memoryDocuments.set(doc.id, doc);

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      await pool.query(
        `INSERT INTO knowledge_documents (id, title, source_type, source_reference, access_classification, approval_status, version, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           source_type = EXCLUDED.source_type,
           source_reference = EXCLUDED.source_reference,
           access_classification = EXCLUDED.access_classification,
           approval_status = EXCLUDED.approval_status,
           version = EXCLUDED.version,
           status = EXCLUDED.status,
           updated_at = NOW();`,
        [doc.id, doc.title, doc.sourceType, doc.sourceReference || '', doc.accessClassification, doc.approvalStatus, doc.version, doc.status]
      );
    } catch (err: any) {
      console.warn('[VectorStore] Error writing document to PostgreSQL:', err.message);
    }
  }
}

export async function saveChunks(chunks: DocumentChunk[]): Promise<void> {
  for (const chunk of chunks) {
    memoryChunks.set(chunk.id, chunk);
  }
  if (chunks.length > 0) {
    const docId = chunks[0].documentId;
    const doc = memoryDocuments.get(docId);
    if (doc) {
      doc.chunkCount = Array.from(memoryChunks.values()).filter((c) => c.documentId === docId).length;
      memoryDocuments.set(docId, doc);
    }
  }

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    for (const chunk of chunks) {
      try {
        const metadataJson = JSON.stringify({
          ...(chunk.metadata || {}),
          documentTitle: chunk.documentTitle,
        });

        if (dbStatus.pgvector && chunk.embedding && chunk.embedding.length > 0) {
          const vectorStr = `[${chunk.embedding.join(',')}]`;
          await pool.query(
            `INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, metadata, embedding)
             VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
             ON CONFLICT (id) DO UPDATE SET
               content = EXCLUDED.content,
               page_number = EXCLUDED.page_number,
               metadata = EXCLUDED.metadata,
               embedding = EXCLUDED.embedding;`,
            [chunk.id, chunk.documentId, chunk.chunkIndex, chunk.content, chunk.pageNumber || null, metadataJson, vectorStr]
          );
        } else {
          await pool.query(
            `INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, metadata, embedding_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               content = EXCLUDED.content,
               page_number = EXCLUDED.page_number,
               metadata = EXCLUDED.metadata,
               embedding_json = EXCLUDED.embedding_json;`,
            [
              chunk.id,
              chunk.documentId,
              chunk.chunkIndex,
              chunk.content,
              chunk.pageNumber || null,
              metadataJson,
              chunk.embedding?.length ? JSON.stringify(chunk.embedding) : null,
            ]
          );
        }
      } catch (err: any) {
        console.warn(`[VectorStore] Error writing chunk ${chunk.id} to PostgreSQL:`, err.message);
      }
    }
  }
}

export async function deleteDocument(docId: string): Promise<void> {
  memoryDocuments.delete(docId);
  for (const [id, chunk] of memoryChunks.entries()) {
    if (chunk.documentId === docId) {
      memoryChunks.delete(id);
    }
  }

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      await pool.query('DELETE FROM document_chunks WHERE document_id = $1;', [docId]);
      await pool.query('DELETE FROM knowledge_documents WHERE id = $1;', [docId]);
    } catch (err: any) {
      console.warn(`[VectorStore] Error deleting document ${docId} from PostgreSQL:`, err.message);
    }
  }
}

export async function listDocuments(): Promise<KnowledgeDocument[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      const res = await pool.query(
        `SELECT d.*, COUNT(c.id) as chunk_count
         FROM knowledge_documents d
         LEFT JOIN document_chunks c ON d.id = c.document_id
         GROUP BY d.id
         ORDER BY d.created_at ASC;`
      );
      return res.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        sourceType: r.source_type,
        sourceReference: r.source_reference,
        accessClassification: r.access_classification,
        approvalStatus: r.approval_status,
        version: r.version,
        status: r.status,
        chunkCount: parseInt(r.chunk_count || '0', 10),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err: any) {
      console.warn('[VectorStore] Error reading documents from PostgreSQL, falling back to memory:', err.message);
    }
  }
  return Array.from(memoryDocuments.values());
}

export async function searchChunks(
  queryVector: number[],
  queryText: string,
  topK: number = 4,
  minRelevanceScore: number = 0.50
): Promise<SearchResult[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected && dbStatus.pgvector && queryVector.length > 0) {
    try {
      const vectorStr = `[${queryVector.join(',')}]`;
      const res = await pool.query(
        `SELECT c.id, c.document_id, c.chunk_index, c.content, c.page_number, c.metadata,
                d.title as "documentTitle",
                1 - (c.embedding <=> $1::vector) as similarity
         FROM document_chunks c
         JOIN knowledge_documents d ON c.document_id = d.id
         WHERE d.access_classification = 'public' 
           AND d.approval_status = 'approved'
           AND c.embedding IS NOT NULL
         ORDER BY c.embedding <=> $1::vector ASC
         LIMIT $2;`,
        [vectorStr, topK * 2]
      );

      if (res.rows.length > 0) {
        return res.rows
          .map((r: any) => ({
            chunk: {
              id: r.id,
              documentId: r.document_id,
              documentTitle: r.documentTitle || (r.metadata?.documentTitle ?? 'College Official Document'),
              chunkIndex: r.chunk_index,
              content: r.content,
              embedding: [],
              pageNumber: r.page_number,
              metadata: r.metadata,
            },
            score: parseFloat(r.similarity),
          }))
          .filter((item: SearchResult) => item.score >= minRelevanceScore)
          .slice(0, topK);
      }
    } catch (err: any) {
      console.warn('[VectorStore] pgvector query failed, executing memory vector search:', err.message);
    }
  }

  const stopWords = new Set(['what', 'is', 'are', 'the', 'of', 'in', 'and', 'to', 'for', 'a', 'an', 'your', 'tell', 'me', 'how', 'can', 'i', 'do']);
  const rawTokens = queryText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const keyTokens = rawTokens.filter((t) => !stopWords.has(t) && t.length > 2);
  const searchTokens = keyTokens.length > 0 ? keyTokens : rawTokens;

  const results: SearchResult[] = [];

  for (const chunk of memoryChunks.values()) {
    const parentDoc = memoryDocuments.get(chunk.documentId);
    if (parentDoc && (parentDoc.accessClassification !== 'public' || parentDoc.approvalStatus !== 'approved')) {
      continue;
    }

    let vectorScore = 0;
    if (queryVector.length > 0 && chunk.embedding && chunk.embedding.length === queryVector.length) {
      vectorScore = cosineSimilarity(queryVector, chunk.embedding);
    }
    const scaledVectorScore = Math.min(1.0, vectorScore * 2.2);
    const chunkLower = chunk.content.toLowerCase();
    let matchCount = 0;
    for (const token of searchTokens) {
      if (chunkLower.includes(token)) {
        matchCount++;
      }
    }
    let tokenScore = 0;
    if (searchTokens.length > 0 && matchCount > 0) {
      tokenScore = 0.45 + (matchCount / searchTokens.length) * 0.55;
    }
    const combinedScore = Math.max(
      scaledVectorScore * 0.4 + tokenScore * 0.6,
      tokenScore,
      scaledVectorScore * 0.6
    );
    if (searchTokens.length > 0 && matchCount === 0 && vectorScore < 0.35) {
      continue;
    }

    if (combinedScore >= minRelevanceScore) {
      results.push({
        chunk,
        score: Math.min(1.0, combinedScore),
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export function getChunkCount(): number {
  return memoryChunks.size;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
}

export async function listAllChunkRecords(): Promise<ChunkRecord[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    const res = await pool.query(
      `SELECT c.id, c.document_id, c.content, d.title
       FROM document_chunks c JOIN knowledge_documents d ON d.id = c.document_id
       ORDER BY c.document_id, c.chunk_index`
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      documentId: r.document_id,
      documentTitle: r.title,
      content: r.content,
    }));
  }
  return Array.from(memoryChunks.values()).map((c) => ({
    id: c.id,
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    content: c.content,
  }));
}

export async function setChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const memoryChunk = memoryChunks.get(chunkId);
  if (memoryChunk) {
    memoryChunk.embedding = embedding;
  }

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    if (dbStatus.pgvector) {
      await pool.query('UPDATE document_chunks SET embedding = $2::vector WHERE id = $1', [
        chunkId,
        `[${embedding.join(',')}]`,
      ]);
    } else {
      await pool.query('UPDATE document_chunks SET embedding_json = $2 WHERE id = $1', [
        chunkId,
        JSON.stringify(embedding),
      ]);
    }
  }
}

export async function hydrateMemoryFromDatabase(): Promise<number> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (!pool || !dbStatus.connected) return 0;

  const docs = await pool.query('SELECT * FROM knowledge_documents');
  for (const r of docs.rows) {
    memoryDocuments.set(r.id, {
      id: r.id,
      title: r.title,
      sourceType: r.source_type,
      sourceReference: r.source_reference,
      accessClassification: r.access_classification,
      approvalStatus: r.approval_status,
      version: r.version,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  const chunks = await pool.query(
    `SELECT c.id, c.document_id, c.chunk_index, c.content, c.page_number, c.metadata, c.embedding_json, d.title
     FROM document_chunks c JOIN knowledge_documents d ON d.id = c.document_id`
  );
  for (const r of chunks.rows) {
    memoryChunks.set(r.id, {
      id: r.id,
      documentId: r.document_id,
      documentTitle: r.title,
      chunkIndex: r.chunk_index,
      content: r.content,
      embedding: Array.isArray(r.embedding_json) ? r.embedding_json : [],
      pageNumber: r.page_number,
      metadata: r.metadata,
    });
  }

  for (const doc of memoryDocuments.values()) {
    doc.chunkCount = Array.from(memoryChunks.values()).filter((c) => c.documentId === doc.id).length;
  }
  return chunks.rows.length;
}

// Student Enquiry Persistence
export async function saveEnquiry(enquiry: Omit<StudentEnquiry, 'id' | 'createdAt' | 'status'>): Promise<StudentEnquiry> {
  const newEnquiry: StudentEnquiry = {
    id: 'enq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ...enquiry,
    status: 'new',
    createdAt: new Date(),
  };
  memoryEnquiries.set(newEnquiry.id, newEnquiry);

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      await pool.query(
        `INSERT INTO enquiries (id, name, email, phone, course_interest, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [newEnquiry.id, newEnquiry.name, newEnquiry.email, newEnquiry.phone, newEnquiry.courseInterest, newEnquiry.message || '', newEnquiry.status, newEnquiry.createdAt]
      );
    } catch (err: any) {
      console.warn('[VectorStore] Error writing enquiry to DB:', err.message);
    }
  }
  return newEnquiry;
}

export async function listEnquiries(): Promise<StudentEnquiry[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      const res = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 100;');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          courseInterest: r.course_interest,
          message: r.message,
          status: r.status,
          createdAt: r.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[VectorStore] Error reading enquiries from DB:', err.message);
    }
  }
  return Array.from(memoryEnquiries.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Unanswered Query Tracking
export async function logUnansweredQuery(query: string): Promise<void> {
  const log: UnansweredQueryLog = {
    id: 'unans-' + Date.now(),
    query,
    createdAt: new Date(),
  };
  memoryUnansweredQueries.push(log);

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      await pool.query('INSERT INTO unanswered_queries (id, query, created_at) VALUES ($1, $2, $3);', [log.id, log.query, log.createdAt]);
    } catch (err: any) {
      console.warn('[VectorStore] Error logging unanswered query to DB:', err.message);
    }
  }
}

export async function listUnansweredQueries(): Promise<UnansweredQueryLog[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      const res = await pool.query('SELECT * FROM unanswered_queries ORDER BY created_at DESC LIMIT 100;');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          query: r.query,
          createdAt: r.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[VectorStore] Error reading unanswered queries from DB:', err.message);
    }
  }
  return [...memoryUnansweredQueries].reverse();
}
