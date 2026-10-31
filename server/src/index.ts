import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config, isGeminiConfigured } from './config';
import { initDatabase } from './db/connection';
import { initializeKnowledgeBase } from './services/documentIngestion';
import { syncAllCircularKnowledge } from './services/circularService';
import { checkGeminiConnection } from './services/llmService';
import { disableGeminiEmbeddings } from './services/embeddingService';
import { saveEnquiry } from './db/vectorStore';
import { chatRouter } from './routes/chat';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { circularRouter, adminCircularRouter } from './routes/circulars';
import { studentRouter, adminStudentRouter } from './routes/students';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Chat rate limiter
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

// Direct Admission Enquiry Endpoint
app.post('/api/enquiry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, courseInterest, message } = req.body;
    if (!name || !email || !phone || !courseInterest) {
      res.status(400).json({
        success: false,
        error: 'Name, email, phone number, and intended course of study are required.',
      });
      return;
    }

    const saved = await saveEnquiry({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      courseInterest: String(courseInterest).trim(),
      message: message ? String(message).trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Admission enquiry received. Our counseling team will contact you shortly.',
      enquiryId: saved.id,
    });
  } catch (err: any) {
    console.error('[EnquiryAPI] Error saving enquiry:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to record admission enquiry: ' + err.message,
    });
  }
});

// Core API Routers
app.use('/api', chatRouter);
app.use('/api/circulars', circularRouter);
app.use('/api/student', studentRouter);
app.use('/api/admin/circulars', adminCircularRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminStudentRouter);
app.use('/api', healthRouter);

// Serve Client SPA assets
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

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

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

async function startServer() {
  console.log('[Server] Starting SmartConnect AI College Information Backend...');

  if (config.nodeEnv === 'production' && config.jwtSecret.includes('change_in_production')) {
    console.error('[Server] JWT_SECRET is still the default value. Set a long random JWT_SECRET before going live.');
  }

  await initDatabase();

  if (isGeminiConfigured()) {
    const status = await checkGeminiConnection();
    if (status.error) {
      console.error('[Gemini] Configuration problem:', status.error);
      if (!status.embeddingOk) {
        disableGeminiEmbeddings();
        console.error('[Gemini] Embeddings are disabled for this run; the local keyword and vector search is being used instead.');
      }
    } else {
      console.log(`[Gemini] Connected. Answers: ${config.geminiModel}, embeddings: ${config.geminiEmbeddingModel}.`);
    }
  } else {
    console.warn('[Gemini] GEMINI_API_KEY is not set. Using the built-in answer engine and keyword retrieval.');
  }

  await initializeKnowledgeBase();
  await syncAllCircularKnowledge(false);

  setInterval(() => {
    syncAllCircularKnowledge(false).catch((err) => console.error('[Circulars] Scheduled sync failed:', err.message));
  }, config.circularSyncIntervalMinutes * 60 * 1000);

  app.listen(config.port, () => {
    console.log(`[Server] SmartConnect Server listening on http://localhost:${config.port}`);
    console.log(`[Server] Health Check available at http://localhost:${config.port}/api/health`);
    console.log(`[Server] Chat API available at http://localhost:${config.port}/api/chat`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Server] Failed to initialize SmartConnect:', err);
  });
}

export default app;
