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

// Resilient in-memory store for fallback or when PostgreSQL is in read-only / standalone mode
const memoryDocuments = new Map<string, KnowledgeDocument>();
const memoryChunks = new Map<string, DocumentChunk>();

// Cosine similarity between two float vectors
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

// Save or update document metadata
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

// Save chunks and embeddings
export async function saveChunks(chunks: DocumentChunk[]): Promise<void> {
  for (const chunk of chunks) {
    memoryChunks.set(chunk.id, chunk);
  }

  // Update chunk count on document
  if (chunks.length > 0) {
    const docId = chunks[0].documentId;
    const doc = memoryDocuments.get(docId);
    if (doc) {
      doc.chunkCount = (doc.chunkCount || 0) + chunks.length;
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
            `INSERT INTO document_chunks (id, document_id, chunk_index, content, embedding, page_number, metadata)
             VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               content = EXCLUDED.content,
               embedding = EXCLUDED.embedding,
               metadata = EXCLUDED.metadata;`,
            [chunk.id, chunk.documentId, chunk.chunkIndex, chunk.content, vectorStr, chunk.pageNumber || 1, metadataJson]
          );
        } else {
          await pool.query(
            `INSERT INTO document_chunks (id, document_id, chunk_index, content, page_number, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               content = EXCLUDED.content,
               metadata = EXCLUDED.metadata;`,
            [chunk.id, chunk.documentId, chunk.chunkIndex, chunk.content, chunk.pageNumber || 1, metadataJson]
          );
        }
      } catch (err: any) {
        console.warn('[VectorStore] Error writing chunk to PostgreSQL:', err.message);
      }
    }
  }
}

// Delete document and all associated chunks
export async function deleteDocument(documentId: string): Promise<boolean> {
  memoryDocuments.delete(documentId);
  for (const [id, chunk] of memoryChunks.entries()) {
    if (chunk.documentId === documentId) {
      memoryChunks.delete(id);
    }
  }

  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      await pool.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
      await pool.query('DELETE FROM knowledge_documents WHERE id = $1', [documentId]);
      return true;
    } catch (err: any) {
      console.warn('[VectorStore] Error deleting document from PostgreSQL:', err.message);
    }
  }
  return true;
}

// List all knowledge documents
export async function listDocuments(): Promise<KnowledgeDocument[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();
  if (pool && dbStatus.connected) {
    try {
      const res = await pool.query(`
        SELECT d.*, COUNT(c.id)::int as "chunkCount"
        FROM knowledge_documents d
        LEFT JOIN document_chunks c ON d.id = c.document_id
        GROUP BY d.id
        ORDER BY d.created_at DESC
      `);
      return res.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        sourceType: r.source_type,
        sourceReference: r.source_reference,
        accessClassification: r.access_classification,
        approvalStatus: r.approval_status,
        version: r.version,
        status: r.status,
        chunkCount: r.chunkCount,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err: any) {
      console.warn('[VectorStore] Error fetching documents from PostgreSQL, using memory store:', err.message);
    }
  }

  return Array.from(memoryDocuments.values());
}

// Search chunks using pgvector (if available) and hybrid cosine similarity
export async function searchChunks(
  queryVector: number[],
  queryText: string,
  topK: number = 4,
  minRelevanceScore: number = 0.50
): Promise<SearchResult[]> {
  const pool = getPool();
  const dbStatus = getDatabaseStatus();

  // Try pgvector in PostgreSQL if available
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

  // Memory/Local hybrid search: computes vector cosine similarity + lexical keyword relevance
  const stopWords = new Set(['what', 'is', 'are', 'the', 'of', 'in', 'and', 'to', 'for', 'a', 'an', 'your', 'tell', 'me', 'how', 'can', 'i', 'do']);
  const rawTokens = queryText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const keyTokens = rawTokens.filter((t) => !stopWords.has(t) && t.length > 2);
  const searchTokens = keyTokens.length > 0 ? keyTokens : rawTokens;

  const results: SearchResult[] = [];

  for (const chunk of memoryChunks.values()) {
    // Only search public & approved documents
    const parentDoc = memoryDocuments.get(chunk.documentId);
    if (parentDoc && (parentDoc.accessClassification !== 'public' || parentDoc.approvalStatus !== 'approved')) {
      continue;
    }

    let vectorScore = 0;
    if (queryVector.length > 0 && chunk.embedding && chunk.embedding.length === queryVector.length) {
      vectorScore = cosineSimilarity(queryVector, chunk.embedding);
    }
    const scaledVectorScore = Math.min(1.0, vectorScore * 2.2);

    // Term matching score
    const chunkLower = chunk.content.toLowerCase();
    let matchCount = 0;
    for (const token of searchTokens) {
      if (chunkLower.includes(token)) {
        matchCount++;
      }
    }

    // If any substantive key tokens match, calculate score
    let tokenScore = 0;
    if (searchTokens.length > 0 && matchCount > 0) {
      tokenScore = 0.45 + (matchCount / searchTokens.length) * 0.55;
    }

    // Hybrid combined score
    const combinedScore = Math.max(
      scaledVectorScore * 0.4 + tokenScore * 0.6,
      tokenScore,
      scaledVectorScore * 0.6
    );

    // If the query has substantive search tokens but zero lexical match and weak vector score, prevent random hash noise match
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

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

// Get total count of indexed chunks
export function getChunkCount(): number {
  return memoryChunks.size;
}
