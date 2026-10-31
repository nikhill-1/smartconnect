export interface SourceCitation {
  id: string;
  documentTitle: string;
  sourceReference?: string;
  section?: string;
  score: number;
}

export interface ChatLink {
  label: string;
  url: string;
}

export interface ChatApiResponse {
  success: boolean;
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  status: 'grounded' | 'fallback' | 'conversational';
  scope?: 'college' | 'student' | 'out_of_scope';
  provider?: string;
  links?: ChatLink[];
  requiresLogin?: boolean;
  loggedIn?: boolean;
  sessionExpired?: boolean;
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

export interface StudentUser {
  id: number;
  pin: string;
  name: string;
  department?: string;
  year?: number;
  section?: string;
  email?: string;
  phone?: string;
  mustChangePassword?: boolean;
}

export interface StudentMark {
  id: number;
  semester: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
}

export interface StudentAttendance {
  id: number;
  semester: string;
  subject: string;
  classesHeld: number;
  classesAttended: number;
  percentage: number;
  isShortage: boolean;
}

export interface AcademicRecord {
  student: StudentUser;
  marks: StudentMark[];
  attendance: StudentAttendance[];
  attendanceSummary: {
    totalHeld: number;
    totalAttended: number;
    overallPercentage: number;
    shortageCount: number;
    requirementPercent: number;
  };
}

export interface CircularAttachment {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface Circular {
  id: number;
  title: string;
  category: string;
  department: string;
  summary: string;
  body: string;
  isPinned: boolean;
  publishAt: string;
  createdAt: string;
  attachments?: CircularAttachment[];
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

export interface EnquirySubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseInterest: string;
  message?: string;
  createdAt: string;
  status: string;
}

export interface UnansweredQueryLog {
  id: string;
  query: string;
  createdAt: string;
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

// Student auth token storage
export const studentAuthStorage = {
  getToken: () => localStorage.getItem('smartconnect_student_token'),
  setToken: (token: string) => localStorage.setItem('smartconnect_student_token', token),
  removeToken: () => localStorage.removeItem('smartconnect_student_token'),
  getStudent: (): StudentUser | null => {
    const raw = localStorage.getItem('smartconnect_student_user');
    return raw ? JSON.parse(raw) : null;
  },
  setStudent: (user: StudentUser) => localStorage.setItem('smartconnect_student_user', JSON.stringify(user)),
  removeStudent: () => localStorage.removeItem('smartconnect_student_user'),
};

/**
 * Send a user query to the RAG backend
 */
export async function sendChatMessage(
  question: string,
  history: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<ChatApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const studentToken = studentAuthStorage.getToken();
  if (studentToken) {
    headers['Authorization'] = `Bearer ${studentToken}`;
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
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
    const headers: Record<string, string> = {};
    const studentToken = studentAuthStorage.getToken();
    if (studentToken) {
      headers['Authorization'] = `Bearer ${studentToken}`;
    }

    const res = await fetch(`${API_BASE}/suggested-questions`, { headers });
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
      { id: '9', label: 'latest circulars', query: 'show the latest circulars' },
    ];
  }
}

/**
 * Student Authentication
 */
export async function studentLogin(pin: string, password: string) {
  const res = await fetch(`${API_BASE}/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid student PIN or password');
  }

  studentAuthStorage.setToken(data.token);
  studentAuthStorage.setStudent(data.student);
  return data;
}

export async function changeStudentPassword(currentPassword: string, newPassword: string) {
  const token = studentAuthStorage.getToken();
  const res = await fetch(`${API_BASE}/student/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to change password');
  }
  return data;
}

export async function fetchStudentAcademics(): Promise<AcademicRecord> {
  const token = studentAuthStorage.getToken();
  const res = await fetch(`${API_BASE}/student/academics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load academic records');
  const data = await res.json();
  return data;
}

/**
 * Public Circulars & Notices
 */
export async function fetchPublicCirculars(): Promise<Circular[]> {
  try {
    const res = await fetch(`${API_BASE}/circulars`);
    const data = await res.json();
    return data.circulars || [];
  } catch {
    return [];
  }
}

export async function fetchCircularById(id: number | string): Promise<Circular | null> {
  const res = await fetch(`${API_BASE}/circulars/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.circular || null;
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
 * Submit an admission enquiry
 */
export async function submitEnquiry(payload: {
  name: string;
  email: string;
  phone: string;
  courseInterest: string;
  message?: string;
}): Promise<{ success: boolean; message: string; enquiryId?: string }> {
  const res = await fetch(`${API_BASE}/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit enquiry');
  }
  return data;
}

/**
 * Fetch all admission enquiries (Admin only)
 */
export async function fetchAdminEnquiries(): Promise<EnquirySubmission[]> {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/enquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Unauthorized or failed to fetch enquiries');
  const data = await res.json();
  return data.enquiries || [];
}

/**
 * Fetch unanswered query logs (Admin only)
 */
export async function fetchAdminUnansweredQueries(): Promise<UnansweredQueryLog[]> {
  const token = authStorage.getToken();
  const res = await fetch(`${API_BASE}/admin/unanswered-queries`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Unauthorized or failed to fetch unanswered queries');
  const data = await res.json();
  return data.queries || [];
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
