import { getEmbedding } from './embeddingService';
import { saveDocument, saveChunks, KnowledgeDocument, DocumentChunk, getChunkCount } from '../db/vectorStore';
import { initialKnowledgeData, KnowledgeDocSeed } from '../data/initialKnowledge';

/**
 * Split plain text into overlapping chunks
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 500,
  chunkOverlap: number = 50
): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= chunkSize) {
      chunks.push(para.trim());
    } else {
      let start = 0;
      while (start < para.length) {
        const end = Math.min(start + chunkSize, para.length);
        chunks.push(para.slice(start, end).trim());
        start += chunkSize - chunkOverlap;
      }
    }
  }

  return chunks.filter((c) => c.length > 5);
}

/**
 * Ingest a single knowledge document seed with its pre-chunked contents
 */
export async function ingestDocSeed(seed: KnowledgeDocSeed): Promise<void> {
  const docMeta: KnowledgeDocument = {
    id: seed.id,
    title: seed.title,
    sourceType: seed.sourceType,
    sourceReference: seed.sourceReference,
    accessClassification: seed.accessClassification,
    approvalStatus: seed.approvalStatus,
    version: seed.version,
    status: 'indexed',
    chunkCount: seed.chunks.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await saveDocument(docMeta);

  const chunksToSave: DocumentChunk[] = [];
  for (let i = 0; i < seed.chunks.length; i++) {
    const item = seed.chunks[i];
    const embedding = await getEmbedding(item.content);

    chunksToSave.push({
      id: `${seed.id}-chunk-${i + 1}`,
      documentId: seed.id,
      documentTitle: seed.title,
      chunkIndex: i + 1,
      content: item.content,
      embedding,
      pageNumber: item.pageNumber,
      metadata: {
        section: item.section,
        sourceReference: seed.sourceReference,
      },
      createdAt: new Date(),
    });
  }

  await saveChunks(chunksToSave);
  console.log(`[Ingestion] Successfully indexed "${seed.title}" with ${chunksToSave.length} chunks.`);
}

/**
 * Initialize the complete official knowledge base on application startup
 */
export async function initializeKnowledgeBase(): Promise<void> {
  const existingCount = getChunkCount();
  if (existingCount > 0) {
    console.log(`[Ingestion] Knowledge base already loaded with ${existingCount} chunks.`);
    return;
  }

  console.log('[Ingestion] Ingesting official TRR institutional documents into vector store...');
  for (const seed of initialKnowledgeData) {
    await ingestDocSeed(seed);
  }
  console.log('[Ingestion] Initial knowledge base ingestion complete.');
}

/**
 * Ingest an uploaded document (from Admin)
 */
export async function ingestCustomDocument(params: {
  id: string;
  title: string;
  sourceType: string;
  sourceReference: string;
  content: string;
  accessClassification?: 'public' | 'restricted';
}): Promise<{ chunkCount: number }> {
  const chunks = splitTextIntoChunks(params.content);
  const docMeta: KnowledgeDocument = {
    id: params.id,
    title: params.title,
    sourceType: params.sourceType,
    sourceReference: params.sourceReference,
    accessClassification: params.accessClassification || 'public',
    approvalStatus: 'approved',
    version: '1.0',
    status: 'indexed',
    chunkCount: chunks.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await saveDocument(docMeta);

  const chunksToSave: DocumentChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    const embedding = await getEmbedding(content);

    chunksToSave.push({
      id: `${params.id}-chunk-${i + 1}`,
      documentId: params.id,
      documentTitle: params.title,
      chunkIndex: i + 1,
      content,
      embedding,
      pageNumber: 1,
      metadata: {
        sourceReference: params.sourceReference,
      },
      createdAt: new Date(),
    });
  }

  await saveChunks(chunksToSave);
  return { chunkCount: chunksToSave.length };
}
