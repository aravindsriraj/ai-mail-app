# AI Mail — AI-Powered Mail Web Application

An AI-powered Gmail client where the assistant **controls the UI programmatically** — composing emails, navigating views, displaying filtered results, and interacting with the interface on the user's behalf through natural language.

Built with **Next.js**, **CopilotKit**, **LangGraph** (Python), and the **Gmail API**.

---

## Features

### Mail Client
- **Inbox** — Real Gmail inbox with sender, subject, preview, date. Click to read.
- **Sent** — List of sent emails. Click to read.
- **Compose** — Write and send emails (To, Subject, Body).
- **Email Detail** — Read full email content with reply/forward buttons.

### AI Assistant (CopilotKit Sidebar)
The assistant panel can **control the UI through natural language**:

| Command | What Happens |
|---|---|
| *"Send an email to john@example.com with subject 'Meeting' and body 'Let's meet at 3pm'"* | Compose view opens, fields visibly fill in, user confirms send |
| *"Show me emails from the last 10 days"* | Searches Gmail, main UI updates with results |
| *"Find the email from Sarah about the project"* | Searches and displays matching emails |
| *"Open the latest email from David"* | Navigates to and displays that email |
| *"Reply to this"* (while reading an email) | Knows which email is open, pre-fills reply |
| *"Show only unread emails from this week"* | Inbox filters accordingly |

### Real-Time Sync
- Google Pub/Sub push notifications for instant inbox updates
- SSE (Server-Sent Events) to push updates to the browser in real-time

### Filters
- By sender, date range, keyword, read/unread status
- Works through both **UI controls** and **assistant commands**

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Next.js Frontend (port 3000)          │
│  ┌──────────┐  ┌────────────┐  ┌───────────────┐ │
│  │ Mail UI  │  │ CopilotKit │  │ useCopilotAction│
│  │ (Inbox,  │  │ Sidebar    │  │ (frontend tools)│
│  │  Sent,   │  │ Chat Panel │  │ navigateTo,     │
│  │  Compose,│  │            │  │ fillComposeForm,│
│  │  Detail) │  │            │  │ openEmail, etc. │
│  └──────────┘  └────────────┘  └───────────────┘ │
│  ┌────────────────────────────────────────────┐   │
│  │ API Routes: /api/gmail/*, /api/copilotkit  │   │
│  │ Auth: NextAuth + Google OAuth 2.0          │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
                      │
       ┌──────────────┴──────────────┐
       │  Python Agent (port 8123)    │
       │  LangGraph + CopilotKit SDK  │
       │  System prompt + middleware   │
       │  Frontend actions via CK      │
       └──────────────────────────────┘
```

### Key Design Decisions

- **Frontend Actions (`useCopilotAction`)** — The agent calls registered frontend tools (navigateTo, fillComposeForm, openEmail, setFilters, displaySearchResults) to imperatively control the UI. This is how the assistant "paints the UI."
- **Context Awareness (`useCopilotReadable`)** — Current view, open email, and active filters are provided to the agent so it knows what the user sees.
- **Gmail API via Next.js routes** — OAuth tokens stay in one place (NextAuth session). The Python agent calls the Next.js API routes for Gmail operations, keeping auth centralized.
- **Zustand for local state** — Lightweight store managing view, emails, compose data, filters. The agent's frontend actions mutate this store, which React re-renders.
- **Human-in-the-loop** — The agent fills the compose form visibly first, then asks the user to confirm before sending.

### Trade-offs

- **Frontend actions, not backend tools** — The agent uses CopilotKit frontend actions (`useCopilotAction`) to control the UI directly, rather than calling Gmail from the backend. This means auth stays centralized in NextAuth and the agent imperatively drives the UI.
- **SSE for real-time** — Pub/Sub requires a public webhook URL. For local dev, SSE keeps the connection alive and delivers updates when Pub/Sub pushes arrive.
- **Dark mode only** — Simpler, consistent design. Could add light mode toggle with more time.

---

## Prerequisites

- Node.js 20+
- Python 3.11+
- A Google Cloud project with:
  - Gmail API enabled
  - OAuth 2.0 credentials (Web application type)
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  - (For real-time) Pub/Sub API enabled with a topic and subscription
- An OpenAI API key (for GPT-4.1)

---

## Setup & Run

### 1. Clone and install

```bash
git clone <your-repo-url>
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
LANGGRAPH_DEPLOYMENT_URL=http://localhost:8000/copilotkit
```

**Agent** — Create `apps/agent/.env`:
```env
OPENAI_API_KEY=your_openai_api_key
NEXT_APP_URL=http://localhost:3000
```

### 3. Run both servers

```bash
# From the root directory — starts both frontend and agent
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
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # Root layout with providers
│   │   │   │   ├── page.tsx          # Main page with CopilotSidebar
│   │   │   │   ├── providers.tsx     # NextAuth + CopilotKit providers
│   │   │   │   └── api/
│   │   │   │       ├── copilotkit/   # CopilotKit runtime endpoint
│   │   │   │       ├── auth/         # NextAuth Google OAuth
│   │   │   │       └── gmail/        # Gmail API routes
│   │   │   ├── components/mail/      # Mail UI components
│   │   │   ├── hooks/                # CopilotKit actions, context, Gmail
│   │   │   ├── lib/                  # Gmail service, auth, store, utils
│   │   │   └── types/                # TypeScript types
│   │   └── package.json
│   └── agent/                        # Python LangGraph agent
│       ├── mail_agent/
│       │   ├── agent.py              # LangGraph graph + system prompt
│       │   ├── state.py              # Agent state types
│       │   └── server.py             # FastAPI + CopilotKit endpoint
│       └── requirements.txt
├── README.md
└── package.json                      # Root workspace scripts
```

---

## What I'd Improve With More Time

- **Thread/conversation view** — Group emails by thread and show the full conversation
- **Light mode toggle** — Currently dark-mode only
- **Richer generative UI** — Email preview cards rendered inline in the chat panel
- **Better error recovery** — Retry logic for Gmail API rate limits
- **Tests** — Unit tests for Gmail service, integration tests for the agent
- **WebSocket** instead of SSE for real-time — More reliable bidirectional communication
- **Attachment support** — View and send email attachments
- **Deployed demo** — Deploy to Vercel (frontend) + Railway (agent)
