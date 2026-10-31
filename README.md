# SmartConnect: AI-Powered College Information System

**Institution:** TRR Group of Institutions, Hyderabad, Telangana  
**Affiliations & Approvals:** Affiliated to JNTU Hyderabad | Approved by AICTE, PCI  
**Version:** 1.0 (Production Release)

---

## 1. Project Overview

SmartConnect is a modernized institutional web portal and RAG (Retrieval-Augmented Generation) AI Assistant for TRR Group of Institutions. It preserves the classic institutional branding, layout, typography, and palette (`#267EB2`, `#1A4A95`, `#5c9dd3`, `#58c1F8`) while completely replacing legacy ungrounded scripts and static servers with an enterprise React, TypeScript, and Node.js architecture.

### Key Capabilities
- **Grounded AI Assistant:** Natural language RAG chatbot grounded strictly in official institutional knowledge documents (college timings, principal information, courses, admission requirements, fee structures, location, accreditations).
- **Zero Hallucination Safeguard:** When evidence does not ground a query, the assistant safely falls back with official contact information and logs the query for administrative review.
- **Floating AI Assistant & Full Page Mode:** Accessible across all public website pages via a floating widget and via dedicated `/chatbot` route.
- **Dedicated Placements & Department Exploration:** Detailed placement records, recruiting partners, CRT training schedules, and program-by-program department information.
- **Admission Enquiry Portal:** Prospective students can submit direct enquiries (`/api/enquiry`) saved directly to the database and accessible via the Admin Portal.
- **Secured Admin Portal:** Multi-layered security with bcrypt password hashing, brute-force lockout protection (5 failed attempts locks for 15 minutes), and secure course spreadsheet verification.
- **Knowledge Base Management:** Administrators can upload new official documents (with `.txt`, `.md`, `.json` file upload support or manual entry), re-index embeddings, and review visitor query insights.

---

## 2. Architecture & Technology Stack

```
smartconnect/
├── client/                     # React 18, Vite, TypeScript Single Page Application
│   ├── src/
│   │   ├── components/         # Header, Navbar, Footer, FloatingChatWidget, AdmissionModal
│   │   ├── pages/              # Home, AboutUs, Departments, Academics, Facilities, Placements, Admissions, Chatbot, Admin
│   │   ├── services/           # Typed API clients for Chat, Enquiries, Admin
│   │   └── styles/             # Institutional CSS & Chatbot UI
│   └── dist/                   # Production build output
├── server/                     # Node.js, Express, TypeScript Backend
│   ├── src/
│   │   ├── db/                 # PostgreSQL pgvector schema + resilient fallback vector store
│   │   ├── routes/             # Chat, Enquiries, Admin, Suggested Questions
│   │   ├── services/           # RAG retrieval, Gemini/Local LLM synthesis, Auth, Document Ingestion
│   │   └── tests/              # Automated verification test suite (17 tests)
│   └── dist/                   # Compiled backend build output
├── static/                     # Legacy static assets (preserved for backward compatibility, sanitized)
└── .env.example                # Environment variables template
```

---

## 3. Security & Privacy Hardening

1. **Student Record Protection:** Raw student spreadsheets have been permanently removed from public web server paths. Only audited course identifiers can be looked up through authenticated administrator endpoints (`/api/admin/spreadsheet-lookup`).
2. **Cryptographic Authentication:** Administrator passwords use standard `bcryptjs` hashing with salted work factors. Plaintext fallbacks and exposed client credentials have been eliminated.
3. **Brute Force Protection:** Authentication endpoints monitor failed attempts per IP and account; exceeding 5 consecutive failures triggers an automatic 15-minute security lockout.
4. **Header Hardening & CORS:** Configured with `helmet()` HTTP headers, Express `trust proxy` support, and strict CORS policies.
5. **Environment Isolation:** Secrets and API keys are strictly loaded via `.env` and excluded from source control and distribution packages.

---

## 4. Getting Started & Setup

### Prerequisites
- Node.js (v18 or higher recommended; Node 20+ tested)
- npm or pnpm
- Optional: PostgreSQL with `pgvector` extension (the server automatically runs in resilient in-memory vector mode if PostgreSQL is not connected).

### Installation

1. **Clone or extract repository:**
   ```bash
   cd smartconnect
   ```

2. **Backend Setup:**
   ```bash
   cd server
   cp ../.env.example .env
   npm install
   npm run build
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   npm run build
   ```

### Running the Application

- **Start Backend Server:**
  ```bash
  cd server
  npm start
  # Server runs on http://localhost:5000
  ```

- **Run Verification Test Suite:**
  ```bash
  cd server
  npm test
  # Runs the 17-point RAG, retrieval, normalization, and security test suite
  ```

- **Start Frontend Development Server (Optional):**
  ```bash
  cd client
  npm run dev
  # Vite dev server runs on http://localhost:5173 with proxy to backend
  ```

---

## 5. API Endpoints Reference

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/chat` | Public | Process natural-language user query via RAG |
| `GET` | `/api/suggested-questions` | Public | Retrieve prompt chips for visitors |
| `POST` | `/api/enquiry` | Public | Submit prospective student admission enquiry |
| `POST` | `/api/admin/login` | Public (Protected) | Authenticate admin, returns JWT token |
| `GET` | `/api/admin/documents` | Admin JWT | List all indexed knowledge documents |
| `POST` | `/api/admin/documents` | Admin JWT | Ingest and chunk new knowledge document |
| `POST` | `/api/admin/documents/:id/reindex` | Admin JWT | Re-chunk and re-embed existing document |
| `DELETE`| `/api/admin/documents/:id` | Admin JWT | Remove document from vector store |
| `GET` | `/api/admin/enquiries` | Admin JWT | View submitted prospective student enquiries |
| `GET` | `/api/admin/unanswered-queries` | Admin JWT | View visitor queries that triggered fallback |
| `POST` | `/api/admin/spreadsheet-lookup` | Admin JWT | Look up authorized course spreadsheets |

---

## 6. Institutional Compliance & Contact

**TRR Group of Institutions**  
Pragathi Colony, Meerpet, Balapur Mandal, Hyderabad - 500097, Telangana, India.  
- **Admissions Helpline:** +91 9154364306 / +91 9849000000  
- **General Inquiries:** contact@trr.edu.in  
- **Approved by:** All India Council for Technical Education (AICTE), Pharmacy Council of India (PCI)  
- **Affiliated with:** Jawaharlal Nehru Technological University Hyderabad (JNTUH)
