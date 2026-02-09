# AI Mail — AI-Powered Gmail Client

A Gmail client where an AI assistant **controls the mail UI programmatically** — navigating views, composing emails, applying filters, and reading emails on the user's behalf through natural language commands in a chat sidebar.

Built with **Next.js 16**, **CopilotKit**, **LangGraph** (Python), and the **Gmail API**.

Demo: https://www.loom.com/share/6b31353ec8fe4db1bd03a6b142103537

---

## Features

### Mail Client
- **Inbox** — Real Gmail inbox with sender, subject, preview snippet, date. Loads 100 emails at a time with pagination (Load More). Click any email to read.
- **Sent** — Sent folder with the same UI. Paginated.
- **Compose** — Write and send emails (To, Subject, Body). Supports replies with `In-Reply-To` and `threadId` threading.
- **Email Detail** — Full email body (text or HTML) with sender, date, subject. Reply and forward buttons.
- **Search Results** — Filtered email list displayed after agent or UI-driven searches.
- **Filters** — Filter by sender, date range, keyword, read/unread status. Works through both the **filter bar UI** and **agent chat commands**. Active filters show as blue badges.

### AI Assistant (CopilotKit Sidebar)
The agent runs as a Python LangGraph graph and controls the frontend via CopilotKit frontend actions. It has **no backend tools** — all tools are `useCopilotAction` hooks that run in the browser and manipulate the Zustand store directly.

| Command | What Happens |
|---|---|
| *"Send an email to john@example.com with subject 'Meeting' and body 'Let's meet at 3pm'"* | Switches to compose view, fills in all fields, asks for confirmation, sends on "yes" |
| *"Show me emails from the last 10 days"* | Builds a Gmail query (`after:YYYY/MM/DD`), fetches results, updates inbox view |
| *"Open the latest email"* | Searches current inbox list, fetches full email, switches to detail view |
| *"Reply to this"* (while reading an email) | Reads open email context, pre-fills reply compose form |
| *"Show only unread emails"* | Applies `is:unread` Gmail filter, updates inbox |
| *"Rewrite the draft to be more formal"* | Updates the compose body text in-place |

### How the Agent Controls the UI

The agent has **7 frontend actions** registered via `useCopilotAction`:

| Action | What it does |
|---|---|
| `navigateTo` | Switches view (inbox, sent, compose, detail, search) |
| `fillComposeForm` | Populates To/Subject/Body fields and switches to compose view |
| `replyToEmail` | Reads currently open email, pre-fills reply compose form |
| `updateDraft` | Overwrites the body of the current draft |
| `openEmail` | Fuzzy-matches a search term against the inbox list, fetches and displays the email |
| `setFilters` | Builds a Gmail query string from filter parameters, fetches matching emails, updates inbox |
| `sendEmail` | Reads compose data from Zustand store, POSTs to `/api/gmail/send` |

The agent also receives **context** via `useCopilotReadable`: current view, currently open email (truncated body), active filters, compose data, and the first 20 inbox emails with IDs.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│            Next.js Frontend (port 3000)              │
│                                                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Mail UI   │  │  CopilotKit  │  │  Frontend    │ │
│  │  Inbox     │  │  Sidebar     │  │  Actions     │ │
│  │  Sent      │  │  (Chat)      │  │  (7 tools)   │ │
│  │  Compose   │  │              │  │              │ │
│  │  Detail    │  │              │  │  + Readable  │ │
│  │  Search    │  │              │  │  (5 contexts)│ │
│  └────────────┘  └──────────────┘  └──────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ API Routes                                     │  │
│  │  /api/copilotkit  → CopilotKit Runtime         │  │
│  │  /api/gmail/*     → Gmail API (googleapis)     │  │
│  │  /api/auth/*      → NextAuth Google OAuth      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  State: Zustand │ Auth: NextAuth + Google OAuth 2.0  │
└─────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴───────────────┐
          │  Python Agent (port 8123)     │
          │  LangGraph `create_agent()`   │
          │  + CopilotKitMiddleware()     │
          │  Model: GPT-4.1              │
          │  tools=[] (all from frontend) │
          │  Served via `langgraph dev`   │
          └──────────────────────────────┘
```

### How it works

1. User types a message in the CopilotKit sidebar chat
2. CopilotKit runtime (`/api/copilotkit`) forwards it to the LangGraph agent (port 8123)
3. `CopilotKitMiddleware()` auto-injects the 7 frontend actions as tools available to the LLM
4. The agent (GPT-4.1) decides which tool(s) to call based on the system prompt and user context
5. Tool calls stream back to the frontend, where `useCopilotAction` handlers execute them
6. Handlers update the Zustand store → React re-renders the UI
7. Tool results flow back to the agent, which may call more tools or respond in chat

### Key Design Decisions

- **All tools are frontend actions** — The Python agent has `tools=[]`. All 7 tools are defined as `useCopilotAction` hooks in React. `CopilotKitMiddleware()` injects them at runtime. This means the agent controls the UI directly.
- **Gmail API stays server-side** — The frontend actions call Next.js API routes (`/api/gmail/*`), which use the OAuth access token from the NextAuth session. The Python agent never touches Gmail directly.
- **Context awareness** — `useCopilotReadable` feeds 5 pieces of context to the agent: current view, open email, filters, compose data, and visible inbox emails. This lets the agent understand what the user sees.
- **Zustand for state** — Single store manages view, email lists, pagination tokens, compose data, filters. Both UI interactions and agent tool calls mutate the same store.
- **Chat-based confirmation for send** — The agent fills the compose form first (visible to the user), then asks "Shall I send it?" in chat. Only calls `sendEmail` after the user confirms.

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- A Google Cloud project with:
  - Gmail API enabled
  - OAuth 2.0 credentials (Web application type)
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- An OpenAI API key (for GPT-4.1)

---

## Setup & Run

### 1. Clone and install

```bash
git clone https://github.com/aravindsriraj/ai-mail-app.git
cd ai-mail-app

# Install root dependencies (concurrently)
npm install

# Install frontend dependencies
cd apps/web && npm install && cd ../..

# Set up Python agent
cd apps/agent
python3.11 -m venv .venv
.venv/bin/pip install --upgrade pip setuptools wheel
.venv/bin/pip install -r requirements.txt
cd ../..
```

### 2. Configure environment variables

**Frontend** — Create `apps/web/.env.local`:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_secret_here          # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

**Agent** — Create `apps/agent/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run both servers

```bash
# From the root directory — starts both frontend (port 3000) and agent (port 8123)
npm run dev
```

Or run them separately:
```bash
# Terminal 1: Next.js frontend
cd apps/web && npm run dev

# Terminal 2: Python agent (LangGraph dev server)
cd apps/agent && .venv/bin/langgraph dev --port 8123
```

### 4. Open the app

Navigate to `http://localhost:3000`, sign in with Google, and start chatting with the AI assistant.

---

## Project Structure

```
ai-mail-app/
├── apps/
│   ├── web/                              # Next.js 16 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx              # Main page — CopilotSidebar wrapping MailApp
│   │   │   │   ├── providers.tsx         # SessionProvider + CopilotKit provider
│   │   │   │   ├── layout.tsx            # Root layout
│   │   │   │   └── api/
│   │   │   │       ├── copilotkit/       # CopilotKit runtime → LangGraphAgent
│   │   │   │       ├── auth/             # NextAuth Google OAuth routes
│   │   │   │       └── gmail/
│   │   │   │           ├── messages/     # GET list/search, GET by ID
│   │   │   │           └── send/         # POST send email
│   │   │   ├── components/mail/
│   │   │   │   ├── mail-app.tsx          # Root mail component (registers hooks)
│   │   │   │   ├── inbox.tsx             # Inbox view with pagination
│   │   │   │   ├── sent.tsx              # Sent view with pagination
│   │   │   │   ├── compose.tsx           # Compose form (To, Subject, Body, Send)
│   │   │   │   ├── email-detail.tsx      # Full email reader
│   │   │   │   ├── email-list.tsx        # Paginated email list (20/page)
│   │   │   │   ├── email-list-item.tsx   # Single email row
│   │   │   │   ├── filters.tsx           # Filter bar + active filter badges
│   │   │   │   ├── search-results.tsx    # Search results view
│   │   │   │   └── sidebar-nav.tsx       # Left nav (Inbox, Sent, Compose)
│   │   │   ├── hooks/
│   │   │   │   ├── use-mail-actions.tsx  # 7 CopilotKit frontend actions
│   │   │   │   ├── use-mail-context.ts   # 5 useCopilotReadable contexts
│   │   │   │   ├── use-gmail.ts          # Gmail API wrapper (fetch, send, search)
│   │   │   │   └── use-realtime-sync.ts  # SSE listener (not active)
│   │   │   ├── lib/
│   │   │   │   ├── gmail.ts              # Server-side Gmail client (googleapis)
│   │   │   │   ├── auth.ts              # NextAuth config + token refresh
│   │   │   │   ├── store.ts             # Zustand store
│   │   │   │   └── utils.ts             # Utility functions
│   │   │   └── types/
│   │   │       └── email.ts              # EmailSummary, EmailDetail, etc.
│   │   ├── scripts/
│   │   │   └── patch-ag-ui-langgraph.js  # Patches @ag-ui/langgraph multi-turn bug
│   │   └── package.json
│   └── agent/                            # Python LangGraph agent
│       ├── mail_agent/
│       │   ├── agent.py                  # create_agent() + CopilotKitMiddleware
│       │   ├── state.py                  # Agent state types
│       │   └── server.py                 # FastAPI server (alternative to langgraph dev)
│       ├── langgraph.json                # LangGraph config (graph: mail_agent)
│       └── requirements.txt
├── package.json                          # Root scripts (npm run dev → concurrently)
└── README.md
```

