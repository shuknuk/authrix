# Authrix - Claude Context

## What is Authrix?

Authrix is a **secure autonomous operations platform for startup teams**. It turns scattered activity across engineering, meetings, documentation, ownership, and operational signals into structured, auditable action.

### What Authrix Is
- A startup operations product with its own logic and control surface
- A secure delegated-action system over real third-party tools
- A shared memory and accountability layer for lean technical teams
- A product backed by an internal autonomous runtime engine

### What Authrix Is NOT
- A generic chatbot
- A one-off automation script
- A fake multi-agent demo
- A dashboard with AI pasted on top
- A thin wrapper around somebody else's runtime

---

## Architecture

Authrix is built as four clear layers:

### 1. Internal Runtime Layer
Handles:
- Long-running execution
- Background processing
- Session lifecycle
- Tool routing
- Provider routing
- Autonomous runtime behavior

The runtime layer reuses proven OpenClaw runtime infrastructure under MIT license.

### 2. Product Backend
The Authrix application brain that owns:
- Workspace state
- Normalized records
- Source ingestion
- Product routing
- Approval handling
- Audit history
- Risk classification
- Agent output persistence
- Integration adapters
- Control-tower-facing data services

### 3. Security and Identity
- Auth0 for delegated access to external systems
- Token Vault for credential custody
- Sandbox boundaries for host-level execution
- Approvals guard external writes and high-risk actions
- Sensitive actions are auditable

### 4. Control Tower (Frontend)
The operating surface of the product that exposes:
- Integration state
- Runtime state
- Source activity
- Agent outputs
- Approvals
- Tasks and ownership
- Costs and risk
- Timeline and audit history

---

## Key Concepts

### Four Specialist Agents

Authrix uses specialized peer agents coordinated by backend logic and shared product state:

1. **Engineer Agent**
   - Inputs: GitHub activity, pull requests, commits, issues
   - Responsibilities: Summarize technical work, identify notable changes, flag technical risk

2. **Docs Agent**
   - Inputs: Meeting transcripts, notes, sync summaries
   - Responsibilities: Create meeting notes, record decisions, maintain durable knowledge artifacts

3. **Workflow Agent**
   - Inputs: Docs outputs, action items, decisions, stale task signals
   - Responsibilities: Identify next actions, suggest owners, detect accountability gaps

4. **DevOps Agent**
   - Inputs: Billing/usage signals, token usage, infrastructure usage
   - Responsibilities: Summarize spend and operational health, detect anomalies

### Workspace Snapshot

All agents operate over the same Authrix workspace state:
- One shared product memory
- One shared record system
- One shared decision/task/timeline surface
- Agent-specific identities layered on top

The workspace snapshot is built from multiple source pipelines and persisted to the filesystem.

### Approval-Backed External Writes

Read-only intelligence can run freely. External writes must become proposed actions before execution.

Each proposed action carries:
- Action kind
- Source context
- Target system
- Risk level (low/medium/high)
- Explanation
- Approval state
- Execution outcome

### Integrations

Current integrations:
- **GitHub**: OAuth via Auth0, ingests public activity
- **Slack**: Bot integration for messaging
- **Notion**: Document sync (planned)
- **Auth0**: Identity and delegated access

---

## Important Files

### Documentation
- `docs/implementation-blueprint.md` - Product vision and implementation phases
- `docs/worker-box-runbook.md` - Deployment guide for worker machine setup
- `docs/mvp-guardrails.md` - What NOT to build (scope constraints)
- `docs/autonomy-implementation-plan.md` - Active roadmap for true autonomy

### Core Data Pipeline
- `lib/data/workspace.ts` - Workspace snapshot builder, orchestrates all agents
- `lib/data/workspace-store.ts` - Persistence layer for workspace state
- `lib/github/service.ts` - GitHub integration with live/mock fallback
- `lib/costs/service.ts` - Cost aggregation from Vercel/OpenAI/GitHub

### Agent Definitions
- `lib/agents/engineer.ts` - Engineering activity summarizer
- `lib/agents/docs.ts` - Meeting notes and decision extractor
- `lib/agents/workflow.ts` - Task and ownership manager
- `lib/agents/devops.ts` - Cost and operations analyst

### Dashboard Components
- `app/dashboard/page.tsx` - Main dashboard page
- `components/dashboard/weekly-summary-card.tsx` - Engineering summary
- `components/dashboard/cost-risk-card.tsx` - Spend analysis
- `components/dashboard/approval-queue-card.tsx` - Pending approvals
- `components/dashboard/suggested-tasks-card.tsx` - Workflow tasks

### Runtime
- `lib/runtime/service.ts` - Runtime bridge implementation
- `lib/models/provider.ts` - LLM provider abstraction
- `lib/models/registry.ts` - Per-agent model defaults

---

## Data Flow

```
GitHub API → GitHub Service → Workspace Builder
                                    ↓
Cost APIs → Cost Service → Workspace Builder
                                    ↓
                        ┌─────────────────────┐
                        │   WORKSPACE SNAPSHOT  │
                        └─────────────────────┘
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
               Engineer       Docs Agents     DevOps
               Agent               ↓            Agent
                    ↓          Workflow
                    ↓          Agent
                    └────────→ Snapshot Store
                                   ↓
                           Dashboard UI
```

---

## Environment

### Required
- `AUTH0_DOMAIN` - Auth0 tenant domain
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret
- `AUTH0_SECRET` - Next.js Auth0 SDK secret
- `APP_BASE_URL` - Base URL for callbacks

### Optional (for live data)
- `GITHUB_CLIENT_ID` - GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app secret
- `VERCEL_API_TOKEN` - Vercel API token for cost data
- `OPENAI_API_KEY` - OpenAI API key with usage access
- `SLACK_BOT_TOKEN` - Slack bot token for messaging

---

## Development Notes

### Real-Product Principles
- Real identity before fake trust
- Real source systems before large fake datasets
- Real persistence before complicated automation
- Real approvals before real external writes
- Explicit fallback modes instead of pretending a live path exists

### Branch Strategy
- `main`: stable and demo-safe
- `dev`: shared integration branch
- `feat/*`: feature branches

### Security Priorities
- Dedicated worker-machine deployment is preferred
- Auth0 and Token Vault handle delegated identity
- Approvals guard external writes
- Tool execution moves toward least privilege
