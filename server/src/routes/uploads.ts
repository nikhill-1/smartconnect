import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ALLOWED_ATTACHMENT_EXTENSIONS } from '../services/attachmentText';

const limits = { fileSize: config.maxUploadMb * 1024 * 1024, files: 10 };

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
      cb(new Error(`File type ${ext || '(none)'} is not allowed.`));
      return;
    }
    cb(null, true);
  },
});

const spreadsheetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.csv') {
      cb(new Error('Upload an .xlsx or .csv file.'));
      return;
    }
    cb(null, true);
  },
});

export function attachmentsMiddleware(req: Request, res: Response, next: NextFunction): void {
  attachmentUpload.array('attachments', 10)(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next();
  });
}

export function spreadsheetMiddleware(req: Request, res: Response, next: NextFunction): void {
  spreadsheetUpload.single('file')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next();
  });
}
