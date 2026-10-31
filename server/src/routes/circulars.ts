import { Router, Response } from 'express';
import { requireAdminAuth, AuthenticatedRequest } from '../services/authService';
import { DatabaseUnavailableError } from '../db/connection';
import {
  CIRCULAR_CATEGORIES,
  ValidationError,
  UploadedFile,
  createCircular,
  updateCircular,
  deleteCircular,
  getAdminCircular,
  getPublicCircular,
  listAdminCirculars,
  listPublicCirculars,
  getAttachmentFile,
  parseCircularInput,
  syncAllCircularKnowledge,
} from '../services/circularService';
import { attachmentsMiddleware } from './uploads';

export const circularRouter = Router();
export const adminCircularRouter = Router();

function handleError(res: Response, err: any, fallbackMessage: string): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }
  if (err instanceof DatabaseUnavailableError) {
    res.status(503).json({ success: false, error: err.message });
    return;
  }
  console.error('[CircularAPI]', err);
  res.status(500).json({ success: false, error: fallbackMessage });
}

function paging(query: any): { limit: number; offset: number; page: number } {
  const limit = Math.min(Math.max(parseInt(String(query.limit || '20'), 10) || 20, 1), 100);
  const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1);
  return { limit, offset: (page - 1) * limit, page };
}

function uploadedFiles(req: any): UploadedFile[] {
  return ((req.files as Express.Multer.File[]) || []).map((f) => ({
    originalname: Buffer.from(f.originalname, 'latin1').toString('utf8'),
    mimetype: f.mimetype,
    size: f.size,
    buffer: f.buffer,
  }));
}

function parseIds(value: unknown): number[] {
  if (value === undefined || value === null || value === '') return [];
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw.map((v) => parseInt(String(v), 10)).filter((n) => Number.isInteger(n));
}

circularRouter.get('/categories', (_req, res) => {
  res.json({ success: true, categories: CIRCULAR_CATEGORIES });
});

circularRouter.get('/', async (req, res): Promise<void> => {
  try {
    const { limit, offset, page } = paging(req.query);
    const result = await listPublicCirculars({
      category: req.query.category ? String(req.query.category) : undefined,
      department: req.query.department ? String(req.query.department) : undefined,
      search: req.query.search ? String(req.query.search).slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, page, limit, ...result });
  } catch (err) {
    handleError(res, err, 'Failed to load circulars.');
  }
});

circularRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const circular = Number.isInteger(id) ? await getPublicCircular(id) : null;
    if (!circular) {
      res.status(404).json({ success: false, error: 'Circular not found or no longer active.' });
      return;
    }
    res.json({ success: true, circular });
  } catch (err) {
    handleError(res, err, 'Failed to load the circular.');
  }
});

circularRouter.get('/:id/attachments/:attachmentId', async (req, res): Promise<void> => {
  try {
    const file = await getAttachmentFile(
      parseInt(String(req.params.id), 10),
      parseInt(String(req.params.attachmentId), 10),
      true
    );
    if (!file) {
      res.status(404).json({ success: false, error: 'Attachment not found.' });
      return;
    }
    res.type(file.mimeType);
    res.download(file.filePath, file.originalName);
  } catch (err) {
    handleError(res, err, 'Failed to download the attachment.');
  }
});

adminCircularRouter.use(requireAdminAuth);

adminCircularRouter.get('/', async (req, res): Promise<void> => {
  try {
    const { limit, offset, page } = paging(req.query);
    const result = await listAdminCirculars({
      status: req.query.status ? String(req.query.status) : undefined,
      search: req.query.search ? String(req.query.search).slice(0, 100) : undefined,
      limit,
      offset,
    });
    res.json({ success: true, page, limit, categories: CIRCULAR_CATEGORIES, ...result });
  } catch (err) {
    handleError(res, err, 'Failed to load circulars.');
  }
});

adminCircularRouter.post('/reindex', async (_req, res): Promise<void> => {
  try {
    await syncAllCircularKnowledge(true);
    res.json({ success: true, message: 'All active circulars were re-indexed for the chatbot.' });
  } catch (err) {
    handleError(res, err, 'Failed to re-index circulars.');
  }
});

adminCircularRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const circular = await getAdminCircular(parseInt(String(req.params.id), 10));
    if (!circular) {
      res.status(404).json({ success: false, error: 'Circular not found.' });
      return;
    }
    res.json({ success: true, circular });
  } catch (err) {
    handleError(res, err, 'Failed to load the circular.');
  }
});

adminCircularRouter.get('/:id/attachments/:attachmentId', async (req, res): Promise<void> => {
  try {
    const file = await getAttachmentFile(
      parseInt(String(req.params.id), 10),
      parseInt(String(req.params.attachmentId), 10),
      false
    );
    if (!file) {
      res.status(404).json({ success: false, error: 'Attachment not found.' });
      return;
    }
    res.type(file.mimeType);
    res.download(file.filePath, file.originalName);
  } catch (err) {
    handleError(res, err, 'Failed to download the attachment.');
  }
});

adminCircularRouter.post('/', attachmentsMiddleware, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const input = parseCircularInput(req.body || {});
    const circular = await createCircular(input, uploadedFiles(req), req.user?.username || 'admin');
    res.status(201).json({ success: true, message: 'Circular saved.', circular });
  } catch (err) {
    handleError(res, err, 'Failed to save the circular.');
  }
});

adminCircularRouter.put('/:id', attachmentsMiddleware, async (req, res): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const existing = Number.isInteger(id) ? await getAdminCircular(id) : null;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Circular not found.' });
      return;
    }
    const input = parseCircularInput(req.body || {}, existing);
    const circular = await updateCircular(id, input, uploadedFiles(req), parseIds(req.body?.removeAttachmentIds));
    res.json({ success: true, message: 'Circular updated.', circular });
  } catch (err) {
    handleError(res, err, 'Failed to update the circular.');
  }
});

adminCircularRouter.delete('/:id', async (req, res): Promise<void> => {
  try {
    const removed = await deleteCircular(parseInt(String(req.params.id), 10));
    if (!removed) {
      res.status(404).json({ success: false, error: 'Circular not found.' });
      return;
    }
    res.json({ success: true, message: 'Circular deleted and removed from the chatbot.' });
  } catch (err) {
    handleError(res, err, 'Failed to delete the circular.');
  }
});
