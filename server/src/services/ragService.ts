import { getEmbedding } from './embeddingService';
import { searchChunks, SearchResult } from '../db/vectorStore';
import { generateAnswer } from './llmService';
import { config } from '../config';

export interface ChatSourceCitation {
  id: string;
  documentTitle: string;
  sourceReference?: string;
  section?: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSourceCitation[];
  confidence: number;
  status: 'grounded' | 'fallback' | 'conversational';
  provider?: string;
}

/**
 * Normalizes colloquial or typo-heavy visitor queries
 */
export function normalizeQuery(query: string): string {
  let normalized = query.trim().toLowerCase();

  // Common contractions and typos
  const replacements: Record<string, string> = {
    'whats': 'what is',
    'what\'s': 'what is',
    'whos': 'who is',
    'who\'s': 'who is',
    'wats': 'what is',
    'pls': 'please',
    'plz': 'please',
    'clg': 'college',
    'coll': 'college',
    'btech': 'b.tech',
    'bpharm': 'b.pharm',
    'mpharm': 'm.pharm',
    'poly': 'polytechnic',
    'addmission': 'admission',
    'addmissions': 'admissions',
    'requirment': 'requirement',
    'requirments': 'requirements',
    'timings of college': 'what are the college timings',
    'timings': 'college timings',
    'fee details': 'fee structure of the college',
  };

  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    normalized = normalized.replace(regex, val);
  }

  return normalized;
}

/**
 * Detects common conversational greetings and farewells (preserving existing chatbot behavior)
 */
export function checkConversationalGreeting(text: string): string | null {
  const clean = text.toLowerCase().replace(/[^\w\s]/g, '').trim();

  const greetings = ['hi', 'hello', 'hey', 'hi there', 'greetings'];
  if (greetings.includes(clean)) {
    return 'Hello! Welcome to TRR Group of Institutions. How can I help you today? You can ask about our college timings, admissions, courses, fees, or leadership.';
  }

  const howAreYou = ['how are you', 'how is life', 'how are things', 'how are you doing'];
  if (howAreYou.includes(clean)) {
    return "I'm doing well, thank you! Ready to answer any questions about TRR College.";
  }

  const identity = ['who are you', 'are you bot', 'what is your name', 'your name', 'who created you'];
  if (identity.some((k) => clean.includes(k))) {
    return "I am SmartConnect, the AI-Powered Information Assistant for TRR Group of Institutions, Hyderabad.";
  }

  const farewells = ['bye', 'goodbye', 'see you', 'good night', 'take care'];
  if (farewells.some((k) => clean === k || clean.startsWith(k + ' '))) {
    return 'Thank you for connecting with TRR Group of Institutions! Have a great day ahead.';
  }

  return null;
}

/**
 * Main RAG processing pipeline
 */
export async function processChatQuery(
  question: string,
  conversationHistory?: { role: 'user' | 'assistant'; text: string }[]
): Promise<ChatResponse> {
  const trimmed = question.trim();

  // 1. Validation
  if (!trimmed) {
    return {
      answer: 'Please enter a question to get information about the college.',
      sources: [],
      confidence: 0,
      status: 'fallback',
    };
  }

  if (trimmed.length > config.maxRequestCharLength) {
    return {
      answer: `Your question exceeds the maximum allowed length of ${config.maxRequestCharLength} characters. Please shorten your question.`,
      sources: [],
      confidence: 0,
      status: 'fallback',
    };
  }

  // 2. Quick conversational greeting check
  const directGreeting = checkConversationalGreeting(trimmed);
  if (directGreeting) {
    return {
      answer: directGreeting,
      sources: [],
      confidence: 1.0,
      status: 'conversational',
      provider: 'TRR SmartConnect Conversational Handler',
    };
  }

  // 3. Normalization and embedding
  const normalizedText = normalizeQuery(trimmed);
  const queryVector = await getEmbedding(normalizedText);

  // 4. Retrieve candidate chunks from pgvector / vector store
  const results: SearchResult[] = await searchChunks(
    queryVector,
    normalizedText,
    config.topKChunks,
    config.relevanceThreshold
  );

  // 5. Evidence check
  if (results.length === 0) {
    return {
      answer:
        'I could not find verified information in official college records to answer that question. For further assistance, please contact the TRR Help Desk at 9154364306 or visit our campus in Pragathi Colony, Meerpet, Hyderabad.',
      sources: [],
      confidence: 0,
      status: 'fallback',
      provider: 'TRR Grounded Fallback',
    };
  }

  // 6. Grounded Answer Generation
  const evidenceTexts = results.map((r) => r.chunk.content);
  const answerResult = await generateAnswer({
    question: trimmed,
    evidence: evidenceTexts,
    conversationHistory,
  });

  // 7. Format source citations
  const sources: ChatSourceCitation[] = results.map((r) => ({
    id: r.chunk.id,
    documentTitle: r.chunk.documentTitle,
    sourceReference: r.chunk.metadata?.sourceReference,
    section: r.chunk.metadata?.section,
    score: Math.round(r.score * 100) / 100,
  }));

  const maxConfidence = results.length > 0 ? results[0].score : 0;

  return {
    answer: answerResult.answer,
    sources,
    confidence: Math.round(maxConfidence * 100) / 100,
    status: answerResult.isFallback ? 'fallback' : 'grounded',
    provider: answerResult.provider,
  };
}
