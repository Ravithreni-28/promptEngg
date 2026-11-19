# AI Prompt Studio 🚀
> **Tagline**: *"Create better prompts. Get better AI responses."*

AI Prompt Studio is a web-based prompt engineering platform designed for B.Tech Final-Year Capstone Demonstration. It empowers users to construct, analyze, optimize, evaluate, compare, store, and export high-quality prompts for Large Language Models (LLMs) such as Google Gemini.

---

## 📌 Project Overview & Problem Statement

### The Problem
When interacting with AI models like Google Gemini, users often submit vague, unstructured, or incomplete prompts. This leads to poor model responses, wasted tokens, and inefficient trial-and-error iterations.

### Our Solution
**AI Prompt Studio** acts as an intelligent intermediary. It:
1. **Analyzes Prompt Quality** using a transparent 5-category heuristic engine (Clarity, Specificity, Context, Completeness, Structure).
2. **Generates 5 Optimized Prompt Variations** using Google Gemini across key engineering techniques (*Clear & Concise, Detailed, Role-Based, Step-by-Step, Structured*).
3. **Executes AI Responses** securely via the backend Google GenAI SDK (`@google/genai`).
4. **Evaluates Response Quality** and ranks variations with a transparent formula:
   $$\text{Final Score} = (\text{Prompt Quality Score} \times 0.4) + (\text{Response Quality Score} \times 0.6)$$
5. **Recommends the Best Prompt** with clear justification.
6. **Provides History, Versioning, Collections, Analytics, and Multi-Format Exports (TXT, JSON, CSV)**.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | SPA framework with fast HMR |
| **Styling** | Tailwind CSS, Lucide Icons | Modern dark-mode SaaS UI |
| **Charts** | Recharts | Analytics dashboards |
| **Backend** | Node.js, Express.js | Modular REST API server |
| **Database** | MongoDB, Mongoose | Schema validation & queries |
| **AI Integration** | `@google/genai` (Official SDK) | Google Gemini API integration |
| **Authentication**| JWT (`jsonwebtoken`), `bcryptjs` | Password hashing & protected routes |
| **Security** | `helmet`, `cors`, `express-rate-limit` | API security & rate limiting |

---

## 🏗️ System Architecture & Data Flow

```
+------------------+          HTTP REST           +---------------------+
|                  | ---------------------------> |                     |
|  React Frontend  |  JWT Bearer Authorization    | Express Backend     |
|   (Vite SPA)     | <--------------------------- |   (Node.js REST)    |
+------------------+                              +---------------------+
                                                             |
                                         +-------------------+-------------------+
                                         |                                       |
                                         v                                       v
                             +------------------------+             +------------------------+
                             | Official @google/genai |             | MongoDB Database       |
                             | (GEMINI_API_KEY in .env)|            | (Mongoose Schemas)     |
                             +------------------------+             +------------------------+
                                         |
                                         v
                             +------------------------+
                             | Google Gemini API      |
                             | (gemini-2.5-flash)     |
                             +------------------------+
```

> 🔒 **Security Protocol**: `GEMINI_API_KEY` is maintained **exclusively** within server environment variables (`server/.env`). It is never bundled into or accessible by the React frontend.

---

## 📁 Directory Structure

```
ai-prompt-studio/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # ScoreCard, VariationCard, ResponseCard, ComparisonTable, ExportModal, Toast
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── pages/               # Login, Register, Dashboard, PromptStudio, History, Collections, Favorites, Analytics, Profile, AdminDashboard
│   │   ├── services/            # api.js, authService.js, promptService.js, collectionService.js
│   │   ├── utils/               # exportUtils.js (TXT, JSON, CSV download)
│   │   ├── App.jsx              # Router & Protected Routes
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind & glassmorphism styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Express Backend REST API
│   ├── src/
│   │   ├── config/              # db.js (MongoDB connection with demo fallback)
│   │   ├── controllers/         # authController, promptController, collectionController, analyticsController, adminController
│   │   ├── middleware/          # authMiddleware, errorHandler
│   │   ├── models/              # User, Prompt, Collection, PromptVersion, Activity
│   │   ├── routes/              # authRoutes, promptRoutes, collectionRoutes, analyticsRoutes, adminRoutes
│   │   ├── services/            # geminiService (@google/genai SDK), promptEvaluator, responseEvaluator
│   │   ├── seed/                # seedData.js (Populates sample prompts & test users)
│   │   └── server.js            # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── README.md
└── package.json
```

---

## ⚙️ Environment Configuration

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_prompt_studio
JWT_SECRET=ai_prompt_studio_super_secret_jwt_key_2026

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🚀 How to Run the Application

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Seed Database (Optional)
```bash
npm run seed
```

### 3. Run Development Servers
```bash
# Run both Backend (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev
```

Or run separately:
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

---

## 🔑 Test Credentials (from Seed Script)

| Account | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `demo@example.com` | `password123` | Standard User |
| **Project Admin** | `admin@example.com` | `password123` | Admin Panel Access |

---

## 🌐 Main API Endpoints

| Method | Endpoint | Description | Protection |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User Registration | Public |
| `POST` | `/api/auth/login` | User Login & JWT Issuance | Public |
| `GET` | `/api/auth/me` | Fetch Current User | JWT Protected |
| `POST` | `/api/prompts/analyze` | Heuristic Prompt Quality Analysis | Public |
| `POST` | `/api/prompts/optimize` | Generate 5 Gemini Prompt Variations | Public |
| `POST` | `/api/prompts/generate` | Generate Live Gemini Response | Public |
| `POST` | `/api/prompts/compare` | Evaluate & Rank Variations | Public |
| `GET` | `/api/prompts` | List User Prompts / History | JWT Protected |
| `POST` | `/api/prompts` | Save Prompt & Version Record | JWT Protected |
| `GET` | `/api/collections` | Fetch Folders / Collections | JWT Protected |
| `GET` | `/api/analytics` | Fetch Dashboard Chart Data | JWT Protected |
| `GET` | `/api/admin/stats` | System Analytics & User List | Admin Only |

---

## 🎓 Viva Questions & Answers Guide

1. **How is prompt quality evaluated?**
   - We utilize a deterministic application heuristic (`promptEvaluator.js`) that scores 5 dimensions (0-20 points each): Clarity, Specificity, Context, Completeness, and Structure.
2. **How does Gemini integration work?**
   - The backend uses `@google/genai` (Google's official GenAI JavaScript SDK). The client requests variations or responses from Express endpoints, which execute the SDK call server-side.
3. **How does the ranking engine pick the Best Prompt?**
   - A combined formula ranks variations: $\text{Final Score} = 0.4 \times \text{PromptScore} + 0.6 \times \text{ResponseScore}$.
4. **Is the app functional if Gemini API key or local MongoDB is offline?**
   - Yes! The application handles missing keys and database offline states gracefully with informative demo modes, ensuring full viva presentation reliability.

---


