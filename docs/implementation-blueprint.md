# Authrix Implementation Blueprint

This document is the implementation-facing product writeup for Authrix.

It exists to keep the project grounded as a real startup product, not just a short-term demo. The hackathon can act as a deadline, but the architecture, workflows, and code organization should support a product that can continue growing after the first release.

## Product Definition

Authrix is a secure autonomous operations platform for startup teams.

Its purpose is to turn scattered activity across engineering work, meetings, documentation, ownership, and operational signals into structured, auditable action.

Authrix is not:
- a generic chatbot
- a one-off automation script
- a static dashboard
- a fake multi-agent demo with weak product boundaries
- a thin wrapper around an existing open-source project

Authrix is:
- a startup operations product with a unique vision
- a multi-agent system with clear responsibilities
- a control tower for visibility, approvals, and auditability
- a secure product layer backed by a fully autonomous AI runtime

## Runtime Foundation

Authrix is built upon OpenClaw, an open-source (MIT licensed) multi-channel AI gateway.

OpenClaw provides the generic autonomous runtime infrastructure that every agent system needs. Using it is a practical engineering decision — it saves significant development time on runtime plumbing and lets the team focus entirely on what makes Authrix unique.

### What the runtime provides

- persistent agent execution
- background job handling
- session and conversation lifecycle
- tool calling and provider routing
- multi-step task handling

### What Authrix builds on top

- the startup operations product layer
- workspace context and structured records
- specialized agent logic (engineering, workflow, devops, docs)
- request routing and product-level coordination
- the approval engine
- explainability and auditability
- the control tower UI
- secure integration adapters
- product-specific rules about risk, ownership, and organizational memory

### The boundary

- if it is generic autonomous infrastructure, it belongs to the runtime
- if it exists because Authrix is a startup operations product, it belongs to Authrix

Authrix does not modify or simplify the runtime. It configures and optimizes it for startup operations, and builds the entire product experience on top.

## Runtime Bridge

Authrix communicates with the runtime through a defined bridge interface. This is the key architectural seam in the entire system.

The bridge abstracts the runtime's capabilities into a clean typed contract:

```ts
interface RuntimeBridge {
  executeAgent(input: AgentExecutionRequest): Promise<AgentExecutionResult>
  createSession(config: SessionConfig): Promise<Session>
  invokeTool(tool: string, args: Record<string, unknown>): Promise<ToolResult>
  submitBackgroundJob(job: BackgroundJobRequest): Promise<JobHandle>
}
```

For the MVP, the bridge is implemented with mock/local functions. When the real runtime is wired, the mock is swapped without changing any product code.

This pattern means:
- Authrix can be developed and demoed fully before the runtime is connected
- the product backend never calls runtime internals directly
- runtime upgrades do not break product code
- testing is straightforward with mock implementations

## Development Priorities

The order of priority for the MVP:

1. **Backend and agents** — types, agent logic, runtime bridge, product backend routes
2. **Runtime bridge mock** — local implementations that simulate runtime behavior
3. **Functional UI** — enough control tower to demonstrate the product flow
4. **Real integrations** — GitHub, then others
5. **Auth and identity** — Auth0, Token Vault (deferred until core backend works)
6. **UI refinement** — polish, animations, responsive design, edge states

Backend first. UI refinement later. Mock first. Real integrations incrementally.

## Product Layers

Authrix is built as four clear layers.

### 1. Runtime Foundation

The runtime layer provides:
- persistent execution
- background processing
- tool and workflow execution
- autonomous task handling
- provider routing

This layer is OpenClaw. Authrix configures it; it does not rebuild it.

### 2. Product Backend

This is the real application layer of Authrix and the primary development focus.

It owns:
- workspace state
- routing logic
- normalized source ingestion
- shared record storage
- approval handling
- audit history
- job tracking
- risk classification
- integration adapters
- agent output persistence
- the runtime bridge interface

This is where Authrix becomes a product.

### 3. Security and Identity

Auth0 Token Vault is the intended path for delegated third-party access.

Security rules:
- agents never hold raw credentials
- agents never directly manage OAuth tokens
- all external actions pass through a mediated backend layer
- approvals are enforced by product policy, not by UI copy alone
- sensitive writes must be auditable

Auth0 integration is deferred to after the core backend is functional. During early development, auth is mocked.

### 4. Control Tower

The frontend acts as a live operational surface for the team.

It should show:
- active and recent jobs
- agent outputs
- decision logs
- suggested follow-ups
- pending approvals
- operational alerts
- system timeline entries
- execution history and audit records

The UI should make the system feel autonomous, but never invisible.

The control tower will be built to a functional level during early phases and refined later. Backend is the priority.

## Agent Model

Authrix uses specialized peer agents coordinated by backend and product logic.

There should not be a fake "master agent" responsible for everything.

### Engineering Agent

Inputs:
- GitHub activity
- pull requests
- commits
- issues
- deployment-related engineering metadata when available

Responsibilities:
- summarize technical work
- produce weekly engineering digests
- flag notable architectural or risk changes
- translate raw activity into readable operational intelligence

### Docs Agent

Inputs:
- meeting transcripts
- uploaded audio after transcription
- notes
- sync summaries
- engineering summaries
- manual prompts

Responsibilities:
- create structured meeting notes
- maintain decision logs
- produce durable knowledge artifacts
- capture what happened and what should be remembered

### Workflow Agent

Inputs:
- Docs Agent outputs
- extracted action items
- decisions
- stale task signals
- manual instructions

Responsibilities:
- identify next actions
- suggest owners
- track unresolved work
- surface accountability gaps

### DevOps Agent

Inputs:
- billing and usage signals
- token usage
- infrastructure usage
- deployment context
- other cost-related product signals

Responsibilities:
- summarize spend and operational health
- detect abnormal usage patterns
- correlate changes with engineering activity
- surface risk and drift

## Shared Product Records

Authrix should rely on shared structured records rather than loose text blobs.

Core records should include:
- source events
- normalized engineering activity
- meeting artifacts
- summaries
- decision logs
- workflow tasks
- approval requests
- cost and risk anomalies
- audit events
- agent run results

This shared record model is one of the most important product decisions in the whole system. It is what makes the system feel coherent and explainable.

## Approval and Action Model

Read-only intelligence can run freely.

Any external write should become a proposed action before execution.

Each proposed action should carry:
- a typed action kind
- source context
- affected system
- risk classification
- a user-facing explanation
- approval status
- execution result

Risk model:
- low risk: read-only analysis and passive summaries
- medium risk: shared updates that may need policy-based approval
- high risk: sensitive writes and actions with meaningful workspace consequences

The product should never pretend an action was safely executed if that behavior is not actually implemented.

## Implementation Principles

Implementation should follow these principles:
- keep domain types explicit
- prefer simple functions over orchestration frameworks
- use mock data first when a real integration is not yet stable
- preserve clear boundaries between runtime, backend, agents, and UI
- avoid unnecessary libraries
- keep all important outputs structured
- optimize for believable product leverage over feature count
- backend first, UI refinement later
- design the runtime bridge interface before implementing either side

## Branching and Collaboration Model

Authrix should use a disciplined branching workflow.

### Main branches

- `main`: stable, review-ready, releasable
- `dev`: shared integration branch

### Feature branch rules

All meaningful work should happen in feature branches created from `dev`.

Recommended examples:
- `feat/app-shell-dashboard`
- `feat/runtime-bridge`
- `feat/backend-agents`
- `feat/github-ingestion`
- `feat/approval-engine`
- `feat/auth0-integration`
- `feat/cost-risk-card`
- `feat/control-tower-polish`

### Workflow

Recommended flow:
1. update local `dev`
2. create a focused feature branch
3. make one coherent set of changes
4. commit with a clear message
5. open a PR into `dev`
6. merge `dev` into `main` only when stable

## Implementation Phases

### Phase 0: Foundation and Alignment (complete)

Goal:
- align the repo with the current product vision before code spreads

Deliverables:
- implementation blueprint
- clarified runtime/product boundary
- clarified OpenClaw relationship and runtime bridge pattern
- agreed branch strategy
- decision on mock-first approach

### Phase 1: Backend Foundation and Runtime Bridge

Goal:
- establish the typed backbone of the product

Deliverables:
- Next.js project scaffold (app shell, basic routing)
- shared types for all domain records and agent inputs/outputs
- runtime bridge interface definition
- mock runtime bridge implementation
- product backend route handlers (server actions or API routes)
- agent function stubs with mock data

This is the most important phase. Everything else builds on it.

### Phase 2: Agent Logic and Mock Pipeline

Goal:
- make the agents real at the logic level, powered by mock data

Deliverables:
- pure-function implementations for Engineering, Workflow, and DevOps agents
- mock GitHub activity data
- mock cost/usage data
- agent output-based chaining (engineering summary → task suggestions)
- agent outputs persisted as structured records
- backend routes that serve agent results

### Phase 3: Functional Control Tower

Goal:
- build enough UI to demonstrate the full product flow

Deliverables:
- dashboard page with summary, tasks, cost/risk, and approval cards
- connections page (mock integration status)
- activity page (event timeline)
- tasks page (suggested and pending tasks)
- costs page (spend and risk overview)
- functional loading, empty, and error states
- all cards wired to backend agent outputs

This is a functional UI, not a polished one. Refinement comes later.

### Phase 4: Approval Engine

Goal:
- establish a real trust model

Deliverables:
- typed proposed-action model
- approval queue in the backend
- approval UI in the control tower
- risk classification logic
- mediated action execution flow
- audit entries for action lifecycle

### Phase 5: First Real Integration

Goal:
- replace one mock path with a real source of truth

Deliverables:
- GitHub integration (real API calls through mediated backend)
- normalized engineering activity pipeline
- Engineering Agent output from real repository activity
- downstream task generation from real data

### Phase 6: Runtime Wiring

Goal:
- connect Authrix product behavior to the real autonomous runtime

Deliverables:
- real runtime bridge implementation (calling OpenClaw gateway API)
- OpenClaw gateway configuration for Authrix use cases
- agent execution through runtime instead of local functions
- session persistence through runtime
- background job execution through runtime

### Phase 7: Auth and Identity

Goal:
- add real authentication and delegated token management

Deliverables:
- Auth0 integration for user login
- Token Vault integration for third-party access
- secure backend execution adapters
- approval-aware external action flow
- auditability around delegated actions

### Phase 8: UI Refinement and Polish

Goal:
- make the control tower demo-ready and professional

Deliverables:
- visual polish across all pages
- responsive design
- transitions and micro-interactions
- edge state handling
- demo flow optimization

### Phase 9: Docs, Meeting, and Workflow Depth

Goal:
- expand from engineering intelligence into broader operational intelligence

Deliverables:
- manual meeting upload flow
- transcription and extraction pipeline
- Docs Agent outputs for notes and decision logs
- Workflow Agent outputs for ownership and follow-up tracking
- cross-linking between meetings, tasks, decisions, and engineering work

## Current Status

Phase 0 is complete. The vision, runtime relationship, and development priorities are aligned.

Next step: begin Phase 1 — scaffold the project, define types, build the runtime bridge interface, and implement the mock backend.
