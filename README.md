# CareerFit AI — Personalized ATS Resume Builder

> **Strict Zero-Fabrication ATS Optimization Engine**: Transform real candidate resumes into job-targeted, ATS-friendly resumes while preserving 100% factual accuracy.

CareerFit AI restructures authentic accomplishments, eliminates keyword gaps, reorders skills by job relevance, improves action verbs, and generates ATS-compliant vector PDFs and Microsoft Word DOCX files. It **never** hallucinates or fabricates companies, job titles, technologies, certifications, or metrics. Missing requirements are honestly surfaced as gaps with actionable learning roadmaps.

---

## 🚀 Key Features

* **Strict Zero-Fabrication Guarantee**: AI safety guards verify and sanitize every tailored section. Missing technologies like Docker or AWS are never falsely claimed.
* **Multi-Format Document Ingestion**: Structured JSON extraction from ATS-standard **PDF**, **DOCX**, and **TXT** files.
* **Role & Requirement Detection**: Automatically identifies target role (e.g. *Backend Developer 98% Confidence*), department, and categorized skills.
* **Weighted 6-Factor ATS Scoring**:
  * Technical Skills (30%)
  * Experience Relevance (25%)
  * Keyword Match (20%)
  * Responsibilities Alignment (15%)
  * Education Qualifications (5%)
  * Resume Structure & Hierarchy (5%)
* **Side-by-Side Review & Diff View**: Highlights optimizations in emerald green, preserved sections in neutral gray, and unadded gaps in rose red with explanations.
* **Live Split-Screen Resume Editor**: Instant synchronization between section editing and live ATS preview.
* **4 ATS-Friendly Templates**:
  * `Classic ATS`: Clean centered typography and standard ATS headers.
  * `Modern ATS`: Blue accent lines and prioritized hierarchy.
  * `Technical Role`: Monospace accents, repository links, and prioritized tech stack.
  * `Fresh Graduate`: Elevated education, relevant academic projects, and certifications.
* **Dual-Format ATS Export**: High-fidelity vector PDF generation and editable Microsoft Word (`.docx`).
* **Job Application Tracker**: Kanban board and table tracker (Saved, Applied, Shortlisted, Interviewing, Offer, Archived).
* **Dual-Mode PostgreSQL**: Embedded zero-config PostgreSQL (PGlite) for instant local development + production connection pool for remote PostgreSQL or Supabase.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, React Router v7, TanStack Query, Axios |
| **Backend** | Node.js, Express, TypeScript, Multer, Helmet, Rate Limiter, Cookie Parser |
| **Database** | PostgreSQL 16 (PGlite in-process WASM + standard `pg` Pool), 21 normalized tables |
| **AI Layer** | `AIService` abstraction with Google Gemini (`@google/genai`) & deterministic NLP heuristic engine |
| **Document Processing** | `pdfkit` (Vector ATS PDF), `docx` (OpenXML DOCX), `pdf-parse`, `mammoth` |
| **Testing** | Vitest, Supertest (100% unit, parser, export, and anti-fabrication test pass rate) |

---

## 📁 Repository Structure

```text
careerfit-ai/
├── backend/
│   ├── src/
│   │   ├── ai/            # AIService, GeminiProvider, HeuristicProvider, SafetyGuard
│   │   ├── config/        # Environment configurations & scoring weights
│   │   ├── controllers/   # Auth, Resume, Job, Tailor, Export, Application, Analytics
│   │   ├── db/            # Database connection, migrations, and canonical schema.sql
│   │   ├── middleware/    # JWT Auth, Rate limiting, Error handling
│   │   ├── parsers/       # ResumeParser (PDF/DOCX/TXT) and JobParser
│   │   ├── routes/        # Express API routes (/api/v1/...)
│   │   ├── services/      # MatchingEngine, ATSScoreService, ExportService
│   │   └── index.ts       # Server entry point
│   └── tests/             # Parsers, safety verification, and export test suites
├── frontend/
│   └── src/
│       ├── api/           # API client with token interceptors
│       ├── components/    # FileUploader, ResumeEditor, ResumePreview, SideBySideDiff, Kanban
│       ├── context/       # AuthContext
│       ├── pages/         # Dashboard, Upload, JobAnalysis, TailorReview, Editor, Tracker
│       └── App.tsx        # React Router routes
├── docker-compose.yml     # Multi-container production deployment
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
* Node.js (v20+ recommended)
* npm (v10+)

### 2. Running Locally

Clone and install dependencies:
```bash
# Backend setup
cd backend
npm install
npm run build
npm start

# Frontend setup (in a new terminal)
cd frontend
npm install
npm run dev
```

Visit the application at: **`http://localhost:5173`**
Backend REST API is live at: **`http://localhost:5000/api/v1`**

### 3. Demo Credentials
Click the **"⚡ Auto-fill Demo Account"** button on the Login page or use:
* **Email:** `riswana@example.com`
* **Password:** `password123`

---

## 🧪 Testing

Run the automated test suite covering parsing, zero-fabrication safety rules, and ATS document exporters:
```bash
cd backend
npm test
```

---

## 📄 License
MIT License. Built with strict factual integrity for authentic career growth.