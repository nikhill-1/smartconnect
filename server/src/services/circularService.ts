import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { requirePool, getPool, getDatabaseStatus, withTransaction } from '../db/connection';
import { deleteDocument } from '../db/vectorStore';
import { ingestCustomDocument } from './documentIngestion';
import { extractAttachmentText } from './attachmentText';

export const CIRCULAR_CATEGORIES = [
  'general',
  'academic',
  'examination',
  'admission',
  'scholarship',
  'placement',
  'event',
  'holiday',
  'hostel',
  'sports',
];

export interface CircularInput {
  title: string;
  category: string;
  department: string;
  summary: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  isPinned: boolean;
  publishAt: string | null;
  expiresAt: string | null;
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AttachmentRow {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  textExtracted: boolean;
}

export interface CircularRow {
  id: number;
  title: string;
  category: string;
  department: string;
  summary: string;
  body: string;
  status: string;
  isPinned: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  indexed: boolean;
  isLive: boolean;
  attachments: AttachmentRow[];
}

const LIVE_SQL = `c.status = 'published'
  AND (c.publish_at IS NULL OR c.publish_at <= NOW())
  AND (c.expires_at IS NULL OR c.expires_at > NOW())`;

const BASE_SELECT = `
  SELECT c.*,
    (${LIVE_SQL}) AS is_live,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id', a.id, 'originalName', a.original_name, 'mimeType', a.mime_type,
        'sizeBytes', a.size_bytes, 'textExtracted', length(a.extracted_text) > 0
      ) ORDER BY a.id)
      FROM circular_attachments a WHERE a.circular_id = c.id
    ), '[]'::json) AS attachments
  FROM circulars c`;

function mapRow(r: any): CircularRow {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    department: r.department,
    summary: r.summary,
    body: r.body,
    status: r.status,
    isPinned: r.is_pinned,
    publishAt: r.publish_at ? new Date(r.publish_at).toISOString() : null,
    expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
    createdBy: r.created_by,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    indexed: !!r.indexed_at && new Date(r.indexed_at) >= new Date(r.updated_at),
    isLive: r.is_live,
    attachments: (r.attachments || []).map((a: any) => ({ ...a, sizeBytes: Number(a.sizeBytes) })),
  };
}

export function parseCircularInput(body: any, existing?: CircularRow): CircularInput {
  const pick = (key: string, fallback: string) =>
    body[key] !== undefined && body[key] !== null ? String(body[key]).trim() : fallback;

  const title = pick('title', existing?.title || '');
  if (!title) throw new ValidationError('Title is required.');
  if (title.length > 255) throw new ValidationError('Title must be 255 characters or fewer.');

  const category = pick('category', existing?.category || 'general').toLowerCase();
  if (!CIRCULAR_CATEGORIES.includes(category)) {
    throw new ValidationError(`Category must be one of: ${CIRCULAR_CATEGORIES.join(', ')}.`);
  }

  const status = pick('status', existing?.status || 'draft') as CircularInput['status'];
  if (!['draft', 'published', 'archived'].includes(status)) {
    throw new ValidationError('Status must be draft, published or archived.');
  }

  const parseDate = (key: string, fallback: string | null): string | null => {
    if (body[key] === undefined) return fallback;
    const raw = String(body[key]).trim();
    if (!raw) return null;
    const date = new Date(raw);
    if (isNaN(date.getTime())) throw new ValidationError(`${key} is not a valid date.`);
    return date.toISOString();
  };

  const publishAt = parseDate('publishAt', existing?.publishAt ?? null);
  const expiresAt = parseDate('expiresAt', existing?.expiresAt ?? null);
  if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
    throw new ValidationError('The expiry date must be after the publish date.');
  }

  const summary = pick('summary', existing?.summary || '');
  if (summary.length > 500) throw new ValidationError('Summary must be 500 characters or fewer.');

  const pinnedRaw = body.isPinned;
  const isPinned =
    pinnedRaw === undefined ? existing?.isPinned || false : pinnedRaw === true || pinnedRaw === 'true' || pinnedRaw === '1';

  return {
    title,
    category,
    department: pick('department', existing?.department || 'all') || 'all',
    summary,
    body: pick('body', existing?.body || ''),
    status,
    isPinned,
    publishAt,
    expiresAt,
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function ensureUploadDir(): void {
  fs.mkdirSync(path.join(config.uploadDir, 'circulars'), { recursive: true });
}

function attachmentPath(storedName: string): string {
  return path.join(config.uploadDir, 'circulars', storedName);
}

async function storeAttachments(client: any, circularId: number, files: UploadedFile[]): Promise<void> {
  ensureUploadDir();
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${randomUUID()}${ext}`;
    const text = await extractAttachmentText(file.buffer, file.originalname);
    fs.writeFileSync(attachmentPath(storedName), file.buffer);
    await client.query(
      `INSERT INTO circular_attachments (circular_id, original_name, stored_name, mime_type, size_bytes, extracted_text)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [circularId, file.originalname.slice(0, 255), storedName, file.mimetype || 'application/octet-stream', file.size, text]
    );
  }
}

export async function createCircular(input: CircularInput, files: UploadedFile[], createdBy: string): Promise<CircularRow> {
  const id = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO circulars (title, category, department, summary, body, status, is_pinned, publish_at, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        input.title, input.category, input.department, input.summary, input.body,
        input.status, input.isPinned, input.publishAt, input.expiresAt, createdBy,
      ]
    );
    await storeAttachments(client, res.rows[0].id, files);
    return res.rows[0].id as number;
  });
  const row = (await getAdminCircular(id))!;
  scheduleKnowledgeSync(id);
  return row;
}

export async function updateCircular(
  id: number,
  input: CircularInput,
  files: UploadedFile[],
  removeAttachmentIds: number[]
): Promise<CircularRow | null> {
  const removedFiles: string[] = [];
  const found = await withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE circulars SET title=$2, category=$3, department=$4, summary=$5, body=$6, status=$7,
         is_pinned=$8, publish_at=$9, expires_at=$10, updated_at=NOW()
       WHERE id=$1 RETURNING id`,
      [
        id, input.title, input.category, input.department, input.summary, input.body,
        input.status, input.isPinned, input.publishAt, input.expiresAt,
      ]
    );
    if (res.rowCount === 0) return false;
    if (removeAttachmentIds.length > 0) {
      const removed = await client.query(
        'DELETE FROM circular_attachments WHERE circular_id = $1 AND id = ANY($2::int[]) RETURNING stored_name',
        [id, removeAttachmentIds]
      );
      removed.rows.forEach((r: any) => removedFiles.push(r.stored_name));
    }
    await storeAttachments(client, id, files);
    return true;
  });
  if (!found) return null;
  removedFiles.forEach((name) => fs.rmSync(attachmentPath(name), { force: true }));
  scheduleKnowledgeSync(id);
  return getAdminCircular(id);
}

export async function deleteCircular(id: number): Promise<boolean> {
  const stored = await requirePool().query(
    'SELECT stored_name FROM circular_attachments WHERE circular_id = $1',
    [id]
  );
  const res = await requirePool().query('DELETE FROM circulars WHERE id = $1', [id]);
  if (res.rowCount === 0) return false;
  stored.rows.forEach((r: any) => fs.rmSync(attachmentPath(r.stored_name), { force: true }));
  await deleteDocument(`circular-${id}`);
  return true;
}

export async function getAdminCircular(id: number): Promise<CircularRow | null> {
  const res = await requirePool().query(`${BASE_SELECT} WHERE c.id = $1`, [id]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function listAdminCirculars(params: {
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ items: CircularRow[]; total: number }> {
  const where: string[] = [];
  const values: any[] = [];
  if (params.status && ['draft', 'published', 'archived'].includes(params.status)) {
    values.push(params.status);
    where.push(`c.status = $${values.length}`);
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    where.push(`(c.title ILIKE $${values.length} OR c.summary ILIKE $${values.length})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = await requirePool().query(`SELECT COUNT(*)::int AS n FROM circulars c ${clause}`, values);
  values.push(params.limit, params.offset);
  const res = await requirePool().query(
    `${BASE_SELECT} ${clause} ORDER BY c.is_pinned DESC, c.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: res.rows.map(mapRow), total: total.rows[0].n };
}

export async function listPublicCirculars(params: {
  category?: string;
  department?: string;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ items: CircularRow[]; total: number }> {
  const where: string[] = [LIVE_SQL];
  const values: any[] = [];
  if (params.category && CIRCULAR_CATEGORIES.includes(params.category)) {
    values.push(params.category);
    where.push(`c.category = $${values.length}`);
  }
  if (params.department) {
    values.push(params.department.toLowerCase());
    where.push(`(lower(c.department) = 'all' OR lower(c.department) = $${values.length})`);
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    where.push(`(c.title ILIKE $${values.length} OR c.summary ILIKE $${values.length} OR c.body ILIKE $${values.length})`);
  }
  const clause = `WHERE ${where.join(' AND ')}`;
  const total = await requirePool().query(`SELECT COUNT(*)::int AS n FROM circulars c ${clause}`, values);
  values.push(params.limit, params.offset);
  const res = await requirePool().query(
    `${BASE_SELECT} ${clause}
     ORDER BY c.is_pinned DESC, COALESCE(c.publish_at, c.created_at) DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: res.rows.map(mapRow), total: total.rows[0].n };
}

export async function getPublicCircular(id: number): Promise<CircularRow | null> {
  const res = await requirePool().query(`${BASE_SELECT} WHERE c.id = $1 AND ${LIVE_SQL}`, [id]);
  return res.rows[0] ? mapRow(res.rows[0]) : null;
}

export async function getAttachmentFile(
  circularId: number,
  attachmentId: number,
  publicOnly: boolean
): Promise<{ filePath: string; originalName: string; mimeType: string } | null> {
  const res = await requirePool().query(
    `SELECT a.stored_name, a.original_name, a.mime_type
     FROM circular_attachments a JOIN circulars c ON c.id = a.circular_id
     WHERE a.id = $1 AND a.circular_id = $2 ${publicOnly ? `AND ${LIVE_SQL}` : ''}`,
    [attachmentId, circularId]
  );
  const r = res.rows[0];
  if (!r) return null;
  const filePath = attachmentPath(r.stored_name);
  if (!fs.existsSync(filePath)) return null;
  return { filePath, originalName: r.original_name, mimeType: r.mime_type };
}

export async function latestLiveCirculars(limit: number): Promise<CircularRow[]> {
  const res = await requirePool().query(
    `${BASE_SELECT} WHERE ${LIVE_SQL}
     ORDER BY c.is_pinned DESC, COALESCE(c.publish_at, c.created_at) DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map(mapRow);
}

function formatDate(value: string | null): string {
  if (!value) return 'not specified';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

async function buildKnowledgeText(id: number): Promise<{ title: string; content: string; prefix: string } | null> {
  const circular = await getAdminCircular(id);
  if (!circular) return null;
  const attachments = await requirePool().query(
    'SELECT original_name, extracted_text FROM circular_attachments WHERE circular_id = $1 ORDER BY id',
    [id]
  );
  const issued = formatDate(circular.publishAt || circular.createdAt);
  const parts = [
    `Circular: ${circular.title}`,
    `Category: ${circular.category}`,
    `Department: ${circular.department}`,
    `Issued on: ${issued}`,
    `Valid until: ${formatDate(circular.expiresAt)}`,
  ];
  if (circular.summary) parts.push(`Summary: ${circular.summary}`);
  if (circular.body) parts.push(circular.body);
  for (const a of attachments.rows) {
    if (a.extracted_text) {
      parts.push(`Attachment "${a.original_name}":\n${a.extracted_text}`);
    }
  }
  return {
    title: `Circular: ${circular.title}`,
    content: parts.join('\n\n'),
    prefix: `[Circular "${circular.title}", issued ${issued}]`,
  };
}

export async function syncCircularKnowledge(id: number): Promise<void> {
  const circular = await getAdminCircular(id);
  const docId = `circular-${id}`;
  if (!circular || !circular.isLive) {
    await deleteDocument(docId);
    if (circular) {
      await requirePool().query('UPDATE circulars SET indexed_at = NULL WHERE id = $1', [id]);
    }
    return;
  }
  const knowledge = await buildKnowledgeText(id);
  if (!knowledge) return;
  await ingestCustomDocument({
    id: docId,
    title: knowledge.title,
    sourceType: 'circular',
    sourceReference: `Circular #${id}`,
    content: knowledge.content,
    accessClassification: 'public',
    chunkPrefix: knowledge.prefix,
  });
  await requirePool().query('UPDATE circulars SET indexed_at = NOW() WHERE id = $1', [id]);
}

const runningSyncs = new Set<number>();
const rerunSyncs = new Set<number>();

export function scheduleKnowledgeSync(id: number): void {
  if (runningSyncs.has(id)) {
    rerunSyncs.add(id);
    return;
  }
  runningSyncs.add(id);
  setImmediate(async () => {
    try {
      do {
        rerunSyncs.delete(id);
        await syncCircularKnowledge(id);
      } while (rerunSyncs.has(id));
    } catch (err: any) {
      console.error(`[Circulars] Failed to index circular ${id}:`, err.message);
    } finally {
      rerunSyncs.delete(id);
      runningSyncs.delete(id);
    }
  });
}

export async function syncAllCircularKnowledge(forceReindex: boolean): Promise<void> {
  const dbStatus = getDatabaseStatus();
  if (!getPool() || !dbStatus.connected) return;

  const res = await requirePool().query(
    `SELECT c.id, (${LIVE_SQL}) AS is_live,
            (c.indexed_at IS NOT NULL AND c.indexed_at >= c.updated_at) AS is_indexed
     FROM circulars c`
  );
  for (const row of res.rows) {
    const docId = `circular-${row.id}`;
    try {
      if (row.is_live && (forceReindex || !row.is_indexed)) {
        await syncCircularKnowledge(row.id);
      } else if (!row.is_live && row.is_indexed) {
        await syncCircularKnowledge(row.id);
      } else if (!row.is_live) {
        await deleteDocument(docId);
      }
    } catch (err: any) {
      console.error(`[Circulars] Sync failed for circular ${row.id}:`, err.message);
    }
  }
}
