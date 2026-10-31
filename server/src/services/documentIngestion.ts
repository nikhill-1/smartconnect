import { getBatchEmbeddings, getEmbeddingSignature } from './embeddingService';
import {
  saveDocument,
  saveChunks,
  deleteDocument,
  listDocuments,
  listAllChunkRecords,
  setChunkEmbedding,
  hydrateMemoryFromDatabase,
  KnowledgeDocument,
  DocumentChunk,
} from '../db/vectorStore';
import { getDatabaseStatus, getSetting, setSetting } from '../db/connection';
import { initialKnowledgeData, KnowledgeDocSeed } from '../data/initialKnowledge';

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

  const embeddings = await getBatchEmbeddings(
    seed.chunks.map((c) => c.content),
    seed.title
  );

  await saveDocument(docMeta);

  const chunksToSave: DocumentChunk[] = seed.chunks.map((item, i) => ({
    id: `${seed.id}-chunk-${i + 1}`,
    documentId: seed.id,
    documentTitle: seed.title,
    chunkIndex: i + 1,
    content: item.content,
    embedding: embeddings[i],
    pageNumber: item.pageNumber,
    metadata: {
      section: item.section,
      sourceReference: seed.sourceReference,
    },
    createdAt: new Date(),
  }));

  await saveChunks(chunksToSave);
  console.log(`[Ingestion] Successfully indexed "${seed.title}" with ${chunksToSave.length} chunks.`);
}

export async function rebuildAllEmbeddings(): Promise<number> {
  const records = await listAllChunkRecords();
  console.log(`[Ingestion] Re-embedding ${records.length} chunks with ${getEmbeddingSignature()}...`);
  const byDocument = new Map<string, typeof records>();
  for (const record of records) {
    const list = byDocument.get(record.documentId) || [];
    list.push(record);
    byDocument.set(record.documentId, list);
  }
  for (const list of byDocument.values()) {
    const embeddings = await getBatchEmbeddings(
      list.map((r) => r.content),
      list[0].documentTitle
    );
    for (let i = 0; i < list.length; i++) {
      await setChunkEmbedding(list[i].id, embeddings[i]);
    }
  }
  return records.length;
}

export async function initializeKnowledgeBase(): Promise<void> {
  const dbStatus = getDatabaseStatus();
  const signature = getEmbeddingSignature();

  if (dbStatus.connected && !dbStatus.pgvector) {
    const loaded = await hydrateMemoryFromDatabase();
    console.log(`[Ingestion] Loaded ${loaded} stored chunks into the in-memory vector store.`);
  }

  const existingDocs = await listDocuments();
  const existingIds = new Set(existingDocs.map((d) => d.id));

  if (dbStatus.connected) {
    const storedSignature = await getSetting('embedding_signature');
    if (existingDocs.length > 0 && storedSignature !== signature) {
      console.log(`[Ingestion] Embedding model changed (${storedSignature || 'unknown'} -> ${signature}).`);
      await rebuildAllEmbeddings();
    }
    await setSetting('embedding_signature', signature);
  }

  const missing = initialKnowledgeData.filter((seed) => !existingIds.has(seed.id));
  if (missing.length === 0) {
    console.log(`[Ingestion] Knowledge base ready with ${existingDocs.length} documents.`);
    return;
  }

  console.log(`[Ingestion] Ingesting ${missing.length} official TRR institutional documents...`);
  for (const seed of missing) {
    await ingestDocSeed(seed);
  }
  console.log('[Ingestion] Initial knowledge base ingestion complete.');
}

export async function ingestCustomDocument(params: {
  id: string;
  title: string;
  sourceType: string;
  sourceReference: string;
  content: string;
  accessClassification?: 'public' | 'restricted';
  chunkPrefix?: string;
}): Promise<{ chunkCount: number }> {
  const prefix = params.chunkPrefix ? `${params.chunkPrefix}\n` : '';
  const chunks = splitTextIntoChunks(params.content).map((c) => prefix + c);
  const embeddings = await getBatchEmbeddings(chunks, params.title);

  await deleteDocument(params.id);

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

  const chunksToSave: DocumentChunk[] = chunks.map((content, i) => ({
    id: `${params.id}-chunk-${i + 1}`,
    documentId: params.id,
    documentTitle: params.title,
    chunkIndex: i + 1,
    content,
    embedding: embeddings[i],
    pageNumber: 1,
    metadata: {
      sourceReference: params.sourceReference,
    },
    createdAt: new Date(),
  }));

  await saveChunks(chunksToSave);
  return { chunkCount: chunksToSave.length };
}
