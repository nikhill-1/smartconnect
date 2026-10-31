import { Router, Request, Response } from 'express';
import { processChatQuery } from '../services/ragService';
import { readOptionalStudentSession } from '../services/authService';

export const chatRouter = Router();

const SUGGESTED_QUESTIONS = [
  { id: 'timings', label: 'timings of college', query: 'what are the college timings' },
  { id: 'principal', label: 'Who is the principal?', query: 'Who is the principal of your college?' },
  { id: 'courses', label: 'courses offered?', query: 'what courses are offered by the college' },
  { id: 'about', label: 'Tell me about the college', query: 'Tell me about TRR college' },
  { id: 'contact', label: 'contact us!', query: 'contact info for engineering pharmacy polytechnic' },
  { id: 'documents', label: 'required documents for addmissions', query: 'what documents are required for admission' },
  { id: 'address', label: 'address of the college', query: 'what is the address and location of the college' },
  { id: 'fees', label: 'fee structure of the college', query: 'fee structure of the college' },
  { id: 'circulars', label: 'latest circulars', query: 'show the latest circulars' },
];

const STUDENT_QUESTIONS = [
  { id: 'my-attendance', label: 'my attendance', query: 'show my attendance' },
  { id: 'my-marks', label: 'my marks', query: 'show my marks' },
];

function sanitizeHistory(history: unknown): { role: 'user' | 'assistant'; text: string }[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-6)
    .map((m: any) => ({ role: m.role, text: String(m.text).slice(0, 600) }));
}

chatRouter.get('/suggested-questions', (req: Request, res: Response) => {
  const { session } = readOptionalStudentSession(req.headers.authorization);
  res.json({
    success: true,
    questions: session ? [...STUDENT_QUESTIONS, ...SUGGESTED_QUESTIONS] : SUGGESTED_QUESTIONS,
  });
});

chatRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, history } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required and must be a valid text string.',
      });
      return;
    }

    const { session, expired } = readOptionalStudentSession(req.headers.authorization);
    const response = await processChatQuery(question, sanitizeHistory(history), session);
    res.json({
      success: true,
      sessionExpired: expired,
      ...response,
    });
  } catch (err: any) {
    console.error('[ChatAPI] Error processing question:', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred while retrieving answer. Please try again.',
    });
  }
});
