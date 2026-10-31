import { getEmbedding } from './embeddingService';
import { searchChunks, SearchResult } from '../db/vectorStore';
import { generateAnswer, looksCollegeRelated, outOfScopeAnswer } from './llmService';
import { runChatTools, ChatLink } from './chatTools';
import { StudentSession } from './authService';
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
  scope: 'college' | 'student' | 'out_of_scope';
  provider?: string;
  links?: ChatLink[];
  requiresLogin?: boolean;
  loggedIn: boolean;
}

export function normalizeQuery(query: string): string {
  let normalized = query.trim().toLowerCase();
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

export function checkConversationalGreeting(text: string, session: StudentSession | null = null): string | null {
  const clean = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const firstName = session ? session.name.split(/\s+/)[0] : null;

  const greetings = ['hi', 'hello', 'hey', 'hi there', 'greetings'];
  if (greetings.includes(clean)) {
    return `Hello${firstName ? ' ' + firstName : ''}! Welcome to TRR Group of Institutions. How can I help you today? You can ask about our college timings, admissions, courses, fees, circulars${
      session ? ', or your own marks and attendance' : ''
    }.`;
  }

  const howAreYou = ['how are you', 'how is life', 'how are things', 'how are you doing'];
  if (howAreYou.includes(clean)) {
    return "I'm doing well, thank you! Ready to answer any questions about TRR College.";
  }

  const identity = ['who are you', 'are you bot', 'what is your name', 'your name', 'who created you'];
  if (identity.some((k) => clean.includes(k))) {
    return 'I am SmartConnect, the AI-Powered Information Assistant for TRR Group of Institutions, Hyderabad.';
  }

  const farewells = ['bye', 'goodbye', 'see you', 'good night', 'take care'];
  if (farewells.some((k) => clean === k || clean.startsWith(k + ' '))) {
    return 'Thank you for connecting with TRR Group of Institutions! Have a great day ahead.';
  }

  return null;
}

export async function processChatQuery(
  question: string,
  conversationHistory?: { role: 'user' | 'assistant'; text: string }[],
  session: StudentSession | null = null
): Promise<ChatResponse> {
  const trimmed = question.trim();
  const loggedIn = !!session;

  if (!trimmed) {
    return {
      answer: 'Please enter a question to get information about the college.',
      sources: [],
      confidence: 0,
      status: 'fallback',
      scope: 'college',
      loggedIn,
    };
  }

  if (trimmed.length > config.maxRequestCharLength) {
    return {
      answer: `Your question exceeds the maximum allowed length of ${config.maxRequestCharLength} characters. Please shorten your question.`,
      sources: [],
      confidence: 0,
      status: 'fallback',
      scope: 'college',
      loggedIn,
    };
  }

  const directGreeting = checkConversationalGreeting(trimmed, session);
  if (directGreeting) {
    return {
      answer: directGreeting,
      sources: [],
      confidence: 1.0,
      status: 'conversational',
      scope: 'college',
      provider: 'TRR SmartConnect Conversational Handler',
      loggedIn,
    };
  }

  const normalizedText = normalizeQuery(trimmed);

  const tool = await runChatTools(normalizedText, session);

  if (tool?.requiresLogin) {
    return {
      answer: 'Please log in with your student PIN to view your personal marks and attendance. I can still answer general questions about the college without logging in.',
      sources: [],
      confidence: 1,
      status: 'fallback',
      scope: 'student',
      requiresLogin: true,
      provider: 'TRR Access Control',
      loggedIn,
    };
  }

  if (!looksCollegeRelated(normalizedText) && !tool) {
    return {
      answer: outOfScopeAnswer(loggedIn),
      sources: [],
      confidence: 0,
      status: 'fallback',
      scope: 'out_of_scope',
      provider: 'TRR Scope Guard',
      loggedIn,
    };
  }

  if (tool?.directAnswer && !tool.privateContext) {
    return {
      answer: tool.directAnswer,
      sources: tool.sourceTitle ? [{ id: tool.toolId, documentTitle: tool.sourceTitle, score: 1 }] : [],
      confidence: 1,
      status: 'grounded',
      scope: 'college',
      provider: 'TRR Live Records',
      links: tool.links,
      loggedIn,
    };
  }

  if (tool?.privateContext) {
    const result = await generateAnswer({
      question: trimmed,
      evidence: [],
      studentContext: tool.privateContext,
      loggedIn,
      conversationHistory,
      fallbackAnswer: tool.directAnswer,
    });
    return {
      answer: result.answer,
      sources: [{ id: tool.toolId, documentTitle: tool.sourceTitle || 'Your academic record', score: 1 }],
      confidence: 1,
      status: 'grounded',
      scope: 'student',
      provider: result.provider,
      loggedIn,
    };
  }

  const queryVector = await getEmbedding(normalizedText, 'query');

  const results: SearchResult[] = await searchChunks(
    queryVector,
    normalizedText,
    config.topKChunks,
    config.relevanceThreshold
  );

  if (results.length === 0) {
    const result = await generateAnswer({
      question: trimmed,
      evidence: [],
      loggedIn,
      conversationHistory,
    });
    return {
      answer: result.answer,
      sources: [],
      confidence: 0,
      status: 'fallback',
      scope: result.scope === 'out_of_scope' ? 'out_of_scope' : 'college',
      provider: result.provider,
      loggedIn,
    };
  }

  const evidenceTexts = results.map((r) => r.chunk.content);
  const answerResult = await generateAnswer({
    question: trimmed,
    evidence: evidenceTexts,
    loggedIn,
    conversationHistory,
  });

  const sources: ChatSourceCitation[] = results.map((r) => ({
    id: r.chunk.id,
    documentTitle: r.chunk.documentTitle,
    sourceReference: r.chunk.metadata?.sourceReference,
    section: r.chunk.metadata?.section,
    score: Math.round(r.score * 100) / 100,
  }));

  const circularLinks: ChatLink[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    const match = /^circular-(\d+)-chunk-/.exec(r.chunk.id);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      circularLinks.push({ label: r.chunk.documentTitle.replace(/^Circular:\s*/, ''), url: `/notices/${match[1]}` });
    }
  }

  const maxConfidence = results[0].score;

  return {
    answer: answerResult.answer,
    sources,
    confidence: Math.round(maxConfidence * 100) / 100,
    status: answerResult.isFallback ? 'fallback' : 'grounded',
    scope: 'college',
    provider: answerResult.provider,
    links: circularLinks.length > 0 ? circularLinks : undefined,
    loggedIn,
  };
}
