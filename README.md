# MeetMind — AI Meeting Intelligence Platform

MeetMind turns meeting recordings into searchable organizational knowledge. Upload an
audio/video recording (or paste a transcript) and MeetMind produces a clean transcript, a
structured summary, extracted action items, and a semantic search index so you can later ask
questions like *"what did we decide about the pricing model?"* and jump straight to the moment
it was discussed.

It ships with per-user **workspaces**, full authentication (email/password, Google OAuth, and
role-based access control), and one-click follow-ups that push action items into **Jira** and
**Slack**.

> This repository is a complete, runnable reference implementation. It is architected the way a
> production SaaS would be, but it is designed to run locally end-to-end with Docker Compose.

---

## ✨ Features

| Area | Capability |
| --- | --- |
| **Ingestion** | Upload audio/video, or paste raw transcripts. Async processing pipeline with status tracking. |
| **Transcription** | OpenAI Whisper (`whisper-1`) speech-to-text. |
| **Intelligence** | GPT-powered summaries + action-item extraction via LangChain, with structured JSON output. |
| **Semantic Search** | Transcripts are chunked, embedded, and stored in ChromaDB for natural-language retrieval. |
| **Auth & RBAC** | JWT sessions, Google OAuth 2.0, roles (`owner`, `admin`, `member`), per-workspace membership. |
| **Workspaces** | Isolated tenants — every meeting belongs to a workspace; users only see what they're a member of. |
| **Integrations** | Push action items to Jira issues and post summaries to Slack channels. |
| **Delivery** | Dockerized services, `docker-compose` for local dev, health checks, and 12-factor config. |

## 🏗️ Architecture

```
┌────────────┐        ┌──────────────────────────────────────────────┐
│   React    │  HTTPS │                 Express API                   │
│  (Vite)    │──────▶ │  auth · workspaces · meetings · search        │
└────────────┘        │                                              │
                      │   ┌──────────────┐   ┌───────────────────┐   │
                      │   │ AI Pipeline  │   │  Integrations     │   │
                      │   │ Whisper/GPT  │   │  Jira · Slack     │   │
                      │   │  + LangChain │   └───────────────────┘   │
                      │   └──────┬───────┘                           │
                      └──────────┼───────────────────────────────────┘
                                 │
          ┌──────────────┬───────┴────────┬──────────────────┐
          ▼              ▼                ▼                  ▼
    ┌──────────┐   ┌──────────┐    ┌────────────┐     ┌──────────┐
    │ MongoDB  │   │ ChromaDB │    │  OpenAI    │     │  S3 /    │
    │ metadata │   │ vectors  │    │  models    │     │  local   │
    └──────────┘   └──────────┘    └────────────┘     └──────────┘
```

- **`server/`** — Node.js + Express REST API (business logic, AI orchestration, integrations).
- **`client/`** — React (Vite) single-page app.
- **MongoDB** — users, workspaces, meetings, action items.
- **ChromaDB** — vector store for semantic search.
- **OpenAI** — Whisper (transcription) + GPT (summaries/actions) + embeddings.

## 🚀 Quick Start (Docker)

```bash
git clone <this-repo> meetmind && cd meetmind
cp server/.env.example server/.env      # add your OPENAI_API_KEY etc.
cp client/.env.example client/.env
docker compose up --build
```

- Web app: http://localhost:5173
- API: http://localhost:4000
- API health: http://localhost:4000/api/health

## 🧑‍💻 Local Development (without Docker)

You need Node.js ≥ 18, a MongoDB instance, and a ChromaDB instance.

```bash
# terminal 1 — backend
cd server && npm install && npm run dev

# terminal 2 — frontend
cd client && npm install && npm run dev
```

## ⚙️ Configuration

All configuration is via environment variables — see [`server/.env.example`](server/.env.example)
and [`client/.env.example`](client/.env.example). The only strictly required variable to unlock
AI features is `OPENAI_API_KEY`. Google OAuth, Jira, and Slack are optional and degrade
gracefully when unset.

## 🔌 API Overview

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET`  | `/api/auth/google` | Start Google OAuth flow |
| `GET`  | `/api/auth/me` | Current user |
| `GET/POST` | `/api/workspaces` | List / create workspaces |
| `POST` | `/api/workspaces/:id/members` | Invite a member (role-gated) |
| `GET/POST` | `/api/meetings` | List / create + upload meetings |
| `GET`  | `/api/meetings/:id` | Meeting detail (transcript, summary, actions) |
| `POST` | `/api/meetings/:id/reprocess` | Re-run the AI pipeline |
| `POST` | `/api/search` | Semantic search across a workspace |
| `POST` | `/api/meetings/:id/actions/:actionId/jira` | Create a Jira issue |
| `POST` | `/api/meetings/:id/share/slack` | Post summary to Slack |

## 🧪 Testing

```bash
cd server && npm test
```

## 📁 Project Layout

```
meetmind/
├── client/                 # React (Vite) frontend
├── server/                 # Express API + AI pipeline
│   ├── src/
│   │   ├── config/         # env, db, passport
│   │   ├── models/         # Mongoose schemas
│   │   ├── middleware/     # auth, RBAC, error handling
│   │   ├── controllers/    # request handlers
│   │   ├── routes/         # Express routers
│   │   ├── services/       # AI, vector store, integrations
│   │   └── utils/          # logger, helpers
│   └── tests/
├── docker-compose.yml
└── README.md
```

## 📝 License

MIT © MeetMind
