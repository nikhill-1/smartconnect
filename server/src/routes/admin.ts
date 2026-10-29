import { Router, Request, Response } from 'express';
import {
  authenticateAdmin,
  generateToken,
  requireAdminAuth,
  AuthenticatedRequest,
  AUDITED_COURSE_PIN_REGISTRY,
} from '../services/authService';
import { listDocuments, deleteDocument } from '../db/vectorStore';
import { ingestCustomDocument, ingestDocSeed } from '../services/documentIngestion';
import { initialKnowledgeData } from '../data/initialKnowledge';

export const adminRouter = Router();

/**
 * POST /api/admin/login
 * Validates credentials on server and returns signed session token
 */
adminRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
      return;
    }

    const admin = await authenticateAdmin(String(username).trim(), String(password).trim());
    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials. Access denied.',
      });
      return;
    }

    const token = generateToken(admin);
    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error('[AdminAPI] Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Authentication failed due to server error.',
    });
  }
});

/**
 * GET /api/admin/documents
 * List all knowledge sources (Protected)
 */
adminRouter.get('/documents', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const docs = await listDocuments();
    res.json({
      success: true,
      documents: docs,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge documents.',
    });
  }
});

/**
 * POST /api/admin/documents
 * Upload / ingest new document (Protected)
 */
adminRouter.post('/documents', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, sourceType, sourceReference, content, accessClassification } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: 'Document title and content are required.',
      });
      return;
    }

    const docId = 'doc-' + Date.now();
    const result = await ingestCustomDocument({
      id: docId,
      title: String(title).trim(),
      sourceType: String(sourceType || 'uploaded_notice').trim(),
      sourceReference: String(sourceReference || 'Admin Manual Ingestion').trim(),
      content: String(content).trim(),
      accessClassification: accessClassification === 'restricted' ? 'restricted' : 'public',
    });

    res.json({
      success: true,
      message: `Document "${title}" indexed successfully with ${result.chunkCount} searchable chunks.`,
      documentId: docId,
      chunkCount: result.chunkCount,
    });
  } catch (err: any) {
    console.error('[AdminAPI] Document ingestion error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to index document: ' + err.message,
    });
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Remove document and its chunks (Protected)
 */
adminRouter.delete('/documents/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await deleteDocument(id);
    res.json({
      success: true,
      message: `Document ${id} successfully removed from index.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete document.',
    });
  }
});

/**
 * POST /api/admin/documents/:id/reindex
 * Reprocess / re-index document (Protected)
 */
adminRouter.post('/documents/:id/reindex', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    // Check if initial document seed
    const seed = initialKnowledgeData.find((d) => d.id === id);
    if (seed) {
      await deleteDocument(id);
      await ingestDocSeed(seed);
      res.json({
        success: true,
        message: `Official document "${seed.title}" successfully reindexed.`,
      });
      return;
    }

    res.status(404).json({
      success: false,
      error: 'Document seed not found for reindexing.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reindex document.',
    });
  }
});

/**
 * POST /api/admin/spreadsheet-lookup
 * Secure audited course PIN lookup (Protected)
 */
adminRouter.post('/spreadsheet-lookup', requireAdminAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { pin } = req.body;
    if (!pin) {
      res.status(400).json({
        success: false,
        error: 'Pin / course code is required.',
      });
      return;
    }

    const normalizedPin = String(pin).trim().toLowerCase();
    const entry = AUDITED_COURSE_PIN_REGISTRY[normalizedPin];

    if (!entry) {
      res.json({
        success: false,
        message: 'Pin number format or course spreadsheet does not exist.',
      });
      return;
    }

    res.json({
      success: true,
      courseName: entry.courseName,
      pin: entry.pin,
      spreadsheetUrl: entry.spreadsheetUrl,
      message: `Spreadsheet found for course ${entry.pin}.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Error looking up spreadsheet.',
    });
  }
});
