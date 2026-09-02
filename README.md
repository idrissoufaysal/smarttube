<div align="center">

  <img src="./public/logo.png" alt="SmartTube Logo" width="120" height="120" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);" />

  # 🎓 SmartTube — AI-Powered Video Learning Platform
  
  **Transform any YouTube video into an interactive, structured, and deep learning experience with contextual AI tutoring, smart quizzes, and semantic search.**

  [![Next.js](https://img.shields.io/badge/Next.js-15%2B%20(App%20Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
  [![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge&logo=pinecone)](https://www.pinecone.io/)
  [![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)

  [Explore Features](#-key-features) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Engineering Highlights](#-engineering-highlights-for-recruiters)

</div>

---

## 📸 Visual Walkthrough & Interface Tour

### 🚀 1. Landing Page — Convert Any YouTube Video
A sleek, high-conversion dark-mode interface inviting users to paste any YouTube URL to instantly extract transcripts, generate notes, and index content.

<div align="center">
  <img src="./public/screenshots/hero-landing.png" alt="SmartTube Landing Page" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 900px; box-shadow: 0 20px 50px rgba(0,0,0,0.35);" />
</div>

> **Under the hood**: Instant client validation with Zod, smooth micro-animations, and asynchronous server ingestion trigger.

---

### 📂 2. Video Library & Learning Dashboard
Centralized hub tracking saved video sessions, indexed transcript segments, active quiz attempts, and remaining usage limits.

<div align="center">
  <img src="./public/screenshots/library-collection.png" alt="SmartTube User Library" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 900px; box-shadow: 0 20px 50px rgba(0,0,0,0.35);" />
</div>

> **Under the hood**: Optimized PostgreSQL relational queries via Prisma, live aggregation counters (total videos, indexed segments, quizzes completed), and Clerk authenticated session isolation.

---

### 💬 3. Interactive Study Hub — AI Copilot with Temporal Grounding
Synchronized video player paired with an intelligent RAG tutor. The AI answers user questions citing precise timestamp badges (`voir [Source: mm:ss]`) that automatically seek the video to the referenced moment.

<div align="center">
  <img src="./public/screenshots/ai-chat-study.png" alt="SmartTube AI Chat & Study Session" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 900px; box-shadow: 0 20px 50px rgba(0,0,0,0.35);" />
</div>

> **Under the hood**: Real-time streaming via Vercel AI SDK (`streamText`), Pinecone semantic vector similarity search with millisecond metadata filtering, and custom Vidstack video player controls.

---

## 🌟 Overview

**SmartTube** solves the passive video learning dilemma. Instead of scrolling through hours of YouTube lectures or tutorials trying to find key moments, SmartTube processes video content into an indexed knowledge base.

Users can **ask questions with timestamped source citations**, generate **adaptive quizzes** across varying difficulties to test retention, review **AI-generated structured study notes**, and jump directly to relevant video timestamps in a synchronized player.

---

## ✨ Key Features

### 🤖 1. Retrieval-Augmented Generation (RAG) Video Copilot
- **Semantic Vector Search**: Segments video transcripts into contextual chunks indexed in **Pinecone**.
- **Real-Time Streaming AI Tutor**: Powered by **Vercel AI SDK** with OpenRouter and Google Gemini models (`gemini-2.5-flash`).
- **Interactive Timestamp Citations**: Every answer provides clickable timestamps (`[Source: mm:ss]`) that instantly seek the video player to the exact moment.

### 📝 2. AI-Generated Interactive Quizzes & Assessments
- **Customizable Difficulty Levels**: Generate quizzes for **Easy**, **Medium**, and **Hard** levels on the fly.
- **Detailed Explanations & Instant Feedback**: Comprehensive step-by-step reasoning for each answer.
- **Progress Tracking & Analytics**: Scores, completion status, and historical attempts are persisted in PostgreSQL.

### ⚡ 3. Real-Time Transcript & Video Sync
- **Custom Modern Video Player**: Built using **Vidstack**, featuring synchronized live transcripts with auto-scroll and highlight matching playback time.
- **Transcript Search & Jump**: Instant keyword filtering and direct navigation through long lectures.

### 📚 4. Personalized Study Library & Notes
- **User Dashboard**: Save videos, bookmark key lectures, and organize personal learning history.
- **Comprehensive Auto-Notes**: Synthesize high-level takeaways, chapter breakdowns, and flashcard-ready insights.

### 🔐 5. Full Authentication & Data Isolation
- Seamless social and email authentication via **Clerk**.
- Robust user data isolation with relational foreign keys and Postgres schemas.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Next.js 15 App Router + React 19)"]
        UI[Interactive Study Hub / Dashboard]
        Player[Vidstack Video Player + Transcript Sync]
        ChatUI[Streaming AI Chat Interface]
        QuizUI[Adaptive Quiz & Analytics View]
    end

    subgraph AuthSecurity ["Auth & Security"]
        Clerk[Clerk Auth & Session Sync]
        RateLimiter[In-Memory Token Bucket Rate Limiter]
    end

    subgraph BackendAPI ["Next.js Server API Handlers"]
        API_Video["/api/video (Metadata & Transcript Extractor)"]
        API_Chat["/api/chat (RAG & LLM Streaming)"]
        API_Quiz["/api/quiz (Structured Quiz Generator)"]
    end

    subgraph DataPipeline ["Data & AI Pipeline"]
        Supadata[Supadata / YouTubei Transcript Engine]
        Embeddings[Vector Embeddings Generator]
        Pinecone[Pinecone Vector Database]
        LLM[OpenRouter / Gemini / OpenAI LLMs]
    end

    subgraph Storage ["Persistent Storage"]
        Prisma[Prisma ORM Client]
        Postgres[(PostgreSQL Database)]
    end

    UI --> Clerk
    UI --> RateLimiter
    RateLimiter --> BackendAPI
    
    API_Video --> Supadata
    API_Video --> Embeddings --> Pinecone
    API_Video --> Prisma --> Postgres

    API_Chat --> Pinecone
    API_Chat --> LLM
    API_Chat --> Prisma

    API_Quiz --> LLM
    API_Quiz --> Prisma
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) | App Router, Server Components, Route Handlers |
| **Frontend** | [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) | Type-safe, component-driven UI architecture |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) | Modern design system, Lucide icons, Dark/Light modes |
| **Video Player** | [Vidstack React](https://vidstack.io/) | Highly customizable, responsive player with timestamp control |
| **AI & Orchestration** | [Vercel AI SDK](https://sdk.vercel.ai/), [LangChain](https://js.langchain.com/) | Streamed responses, tool integration, vector operations |
| **Vector DB** | [Pinecone](https://www.pinecone.io/) | High-performance vector index for transcript RAG retrieval |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM 7](https://www.prisma.io/) | Relational database with type-safe schema modeling |
| **Authentication** | [Clerk](https://clerk.com/) | Managed user authentication, session security, and profiles |
| **Data Ingestion** | [@supadata/js](https://supadata.ai/) & [YouTubei.js](https://github.com/LuanRT/YouTube.js) | Resilient transcript & metadata extraction |

---

## 🚀 Getting Started

Follow these steps to set up and run SmartTube locally.

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher
- **npm**, **pnpm**, or **yarn**
- A **PostgreSQL** database (Local, Supabase, Neon, or Docker)
- API Keys:
  - [Clerk](https://clerk.com/) (Authentication)
  - [OpenRouter](https://openrouter.ai/) / [OpenAI](https://platform.openai.com/) / [Google Gemini](https://ai.google.dev/)
  - [Pinecone](https://www.pinecone.io/) (Vector search index)
  - [Supadata](https://supadata.ai/) (Optional / Recommended for transcript fallback)

---

### 1. Clone the Repository

```bash
git clone https://github.com/idrissoufaysal/smarttube.git
cd smarttube
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# -----------------------------------------------
# 🧠 AI & LLM PROVIDER
# -----------------------------------------------
AI_KEY="your_openrouter_or_openai_api_key"

# -----------------------------------------------
# 🌲 VECTOR DATABASE (Pinecone)
# -----------------------------------------------
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_INDEX="smarttube"

# -----------------------------------------------
# 🔐 AUTHENTICATION (Clerk)
# -----------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# -----------------------------------------------
# 🐘 RELATIONAL DATABASE (PostgreSQL)
# -----------------------------------------------
DATABASE_URL="postgresql://user:password@localhost:5432/smarttube?sslmode=prefer"

# -----------------------------------------------
# 📹 TRANSCRIPTION ENGINE
# -----------------------------------------------
SUPADATA_API_KEY="your_supadata_api_key"
```

---

### 4. Database Setup & Migrations

Generate the Prisma client and push schemas to your PostgreSQL database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push
```

---

### 5. Launch the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Engineering Highlights (For Recruiters)

This project showcases full-stack software engineering principles, AI integration patterns, and clean architecture:

1. **Production RAG Pipeline**: Implemented semantic chunking with metadata injection (start time, duration, segment ID), ensuring queries retrieve exact temporal video contexts.
2. **Streaming AI Architecture**: Leveraged Next.js Edge/Server Route Handlers combined with Vercel AI SDK to stream responses word-by-word with low latency.
3. **Resilient Data Ingestion**: Built a multi-strategy transcript extraction pipeline with fallback mechanisms to handle missing or disabled closed captions.
4. **Type-Safe End-to-End**: Strict TypeScript, Zod schema validation on API payloads, and Prisma-generated client types prevent runtime errors.
5. **Modern Design & Micro-Interactions**: Clean dark/light theme styling, responsive layouts, accessible Radix UI components, and smooth transitions.
6. **API Security & Rate Limiting**: In-memory token bucket rate limiters protect expensive LLM and vector database endpoints from abuse.

---

## 📂 Project Structure

```text
smarttube/
├── prisma/
│   └── schema.prisma          # Database models (User, Video, Segment, Quiz, Chat)
├── public/                    # Static assets, logos, and UI previews
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── api/               # Server Route Handlers (Chat, Quiz, Transcript, Video)
│   │   ├── library/           # Saved user videos & study history
│   │   ├── study/             # Dynamic interactive study room ([id])
│   │   ├── globals.css        # Tailwind CSS v4 design tokens
│   │   ├── layout.tsx         # Root layout with Clerk & Theme providers
│   │   └── page.tsx           # High-conversion landing page
│   ├── components/            # Modular UI & Feature components
│   │   ├── chat-interface.tsx # Real-time streaming RAG chat
│   │   ├── quiz-interface.tsx # Adaptive quiz engine with analytics
│   │   ├── video-player.tsx   # Vidstack player with timestamp sync
│   │   ├── study-content.tsx  # Unified workspace orchestrator
│   │   └── ui/                # Reusable Shadcn/Radix UI primitives
│   └── lib/                   # Utility modules
│       ├── auth.ts            # Clerk & User DB synchronizer
│       ├── db.ts              # Prisma singleton client instance
│       ├── pinecone.ts        # Vector DB client & search methods
│       └── rate-limit.ts      # API Rate limiting middleware
├── package.json
└── tsconfig.json
```

---

## 🗺 Roadmap

- [x] Full-text and Vector transcript search
- [x] Streaming AI Chat with timestamp linking
- [x] Dynamic Multi-level Quiz generator
- [x] Personal Video Library & Study History
- [ ] Export study notes to Notion & Markdown
- [ ] Multi-language auto-translation of transcripts
- [ ] Audio/Video AI Podcast summary generator

---

## 👨‍💻 Author

**Idriss Faysal**
- GitHub: [@idrissoufaysal](https://github.com/idrissoufaysal)
- Project Repository: [SmartTube on GitHub](https://github.com/idrissoufaysal/smarttube)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
