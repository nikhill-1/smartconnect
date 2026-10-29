import { Router, Request, Response } from 'express';
import { processChatQuery } from '../services/ragService';

export const chatRouter = Router();

// Official suggested questions matching existing UI buttons
const SUGGESTED_QUESTIONS = [
  { id: 'timings', label: 'timings of college', query: 'what are the college timings' },
  { id: 'principal', label: 'Who is the principal?', query: 'Who is the principal of your college?' },
  { id: 'courses', label: 'courses offered?', query: 'what courses are offered by the college' },
  { id: 'about', label: 'Tell me about the college', query: 'Tell me about TRR college' },
  { id: 'contact', label: 'contact us!', query: 'contact info for engineering pharmacy polytechnic' },
  { id: 'documents', label: 'required documents for addmissions', query: 'what documents are required for admission' },
  { id: 'address', label: 'address of the college', query: 'what is the address and location of the college' },
  { id: 'fees', label: 'fee structure of the college', query: 'fee structure of the college' },
];

/**
 * GET /api/suggested-questions
 */
chatRouter.get('/suggested-questions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    questions: SUGGESTED_QUESTIONS,
  });
});

/**
 * POST /api/chat
 * Body: { question: string, history?: Array<{ role: 'user' | 'assistant', text: string }> }
 */
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

    const response = await processChatQuery(question, history);
    res.json({
      success: true,
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
