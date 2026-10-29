export interface SourceCitation {
  id: string;
  documentTitle: string;
  sourceReference?: string;
  section?: string;
  score: number;
}

export interface ChatApiResponse {
  success: boolean;
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  status: 'grounded' | 'fallback' | 'conversational';
  provider?: string;
  error?: string;
}

export interface SuggestedQuestion {
  id: string;
  label: string;
  query: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

export interface AdminDocument {
  id: string;
  title: string;
  sourceType: string;
  sourceReference?: string;
  accessClassification: 'public' | 'restricted';
  approvalStatus: 'approved' | 'pending';
  version: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';

// Admin auth token storage
export const authStorage = {
  getToken: () => localStorage.getItem('smartconnect_admin_token'),
  setToken: (token: string) => localStorage.setItem('smartconnect_admin_token', token),
  removeToken: () => localStorage.removeItem('smartconnect_admin_token'),
  getUser: (): AdminUser | null => {
    const raw = localStorage.getItem('smartconnect_admin_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: AdminUser) => localStorage.setItem('smartconnect_admin_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('smartconnect_admin_user'),
};

/**
 * Send a user query to the RAG backend
 */
export async function sendChatMessage(
  question: string,
  history: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Server responded with an error');
  }

  return res.json();
}

/**
 * Fetch suggested questions list
 */
export async function fetchSuggestedQuestions(): Promise<SuggestedQuestion[]> {
  try {
    const res = await fetch(`${API_BASE}/suggested-questions`);
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    return [
      { id: '1', label: 'timings of college', query: 'what are the college timings' },
      { id: '2', label: 'Who is the principal?', query: 'Who is the principal of your college?' },
      { id: '3', label: 'courses offered?', query: 'what courses are offered by the college' },
      { id: '4', label: 'Tell me about the college', query: 'Tell me about TRR college' },
      { id: '5', label: 'contact us!', query: 'contact info' },
      { id: '6', label: 'required documents for addmissions', query: 'what documents are required for admission' },
      { id: '7', label: 'address of the college', query: 'what is the address of the college' },
      { id: '8', label: 'fee structure of the college', query: 'fee structure of the college' },
    ];
  }
}

/**
 * Admin Login
 */
export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid credentials');
  }

  authStorage.setToken(data.token);
  authStorage.setUser(data.user);
  return data;
}

/**
 * Fetch documents for admin
 */
export async function fetchAdminDocuments(): Promise<AdminDocument[]> {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Unauthorized or failed to fetch documents');
  const data = await res.json();
  return data.documents || [];
}

/**
 * Upload new knowledge text/document
 */
export async function uploadAdminDocument(payload: {
  title: string;
  sourceType: string;
  sourceReference: string;
  content: string;
  accessClassification?: string;
}) {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload document');
  return data;
}

/**
 * Reindex a document
 */
export async function reindexAdminDocument(docId: string) {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/documents/${docId}/reindex`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reindex document');
  return data;
}

/**
 * Delete a document
 */
export async function deleteAdminDocument(docId: string) {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/documents/${docId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete document');
  return data;
}

/**
 * Secure course spreadsheet lookup (Admin only)
 */
export async function lookupSpreadsheet(pin: string) {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/spreadsheet-lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pin }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
