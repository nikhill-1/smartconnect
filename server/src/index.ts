import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initDatabase } from './db/connection';
import { initializeKnowledgeBase } from './services/documentIngestion';
import { chatRouter } from './routes/chat';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple in-memory rate limiter per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.path.startsWith('/api/chat')) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    } else {
      entry.count++;
      if (entry.count > config.rateLimitMaxPerMinute) {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment before sending another query.',
        });
        return;
      }
    }
  }
  next();
});

// Mount API routes
app.use('/api', chatRouter);
app.use('/api/admin', adminRouter);
app.use('/api', healthRouter);

// Serve built frontend assets if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback for SPA routing in production
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <h1>SmartConnect Backend Running</h1>
        <p>API endpoints are accessible under <code>/api</code>.</p>
        <p>To run the frontend, start the Vite development server on port 5173 or run <code>npm run build</code>.</p>
      `);
    }
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

// Start server
async function startServer() {
  console.log('[Server] Starting SmartConnect AI College Information Backend...');
  
  // 1. Initialize database connection
  await initDatabase();

  // 2. Initialize knowledge base
  await initializeKnowledgeBase();

  // 3. Listen on port
  app.listen(config.port, () => {
    console.log(`[Server] SmartConnect Server listening on http://localhost:${config.port}`);
    console.log(`[Server] Health Check available at http://localhost:${config.port}/api/health`);
    console.log(`[Server] Chat API available at http://localhost:${config.port}/api/chat`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
});
