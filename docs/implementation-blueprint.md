# Authrix Implementation Blueprint

This document is the implementation-facing product writeup for Authrix.

It exists to keep the project grounded as a real startup product, not just a short-term demo. The hackathon can act as a deadline, but the architecture, workflows, and code organization should support a product that can continue growing after the first release.

## Product Definition

Authrix is a secure autonomous operations layer for startup teams.

Its purpose is to turn scattered activity across engineering work, meetings, documentation, ownership, and operational signals into structured, auditable action.

Authrix is not:
- a generic chatbot
- a one-off automation script
- a static dashboard
- a fake multi-agent demo with weak product boundaries

Authrix is:
- a startup operations product
- a multi-agent system with clear responsibilities
- a control tower for visibility, approvals, and auditability
- a secure product layer built on top of an autonomous runtime

## System Boundary

The cleanest way to build Authrix is to separate the runtime layer from the product layer.

### What OpenClaw should own

OpenClaw should act as the runtime foundation.

It should own:
- long-running execution
- task and session lifecycle
- background jobs
- tool execution plumbing
- autonomous runtime behavior
- execution persistence tied to runtime concerns
- generic infrastructure for agent/task handling

### What Authrix should own

Authrix should own the product.

It should own:
- workspace and team state
- integration state and permission state
- typed domain schemas
- normalized records for product data
- specialized agents for startup operations
- request routing and product-level coordination
- approval policies and approval UX
- audit logs and explainability
- decision logs and workflow records
- the shared event timeline
- the Next.js control tower
- secure backend adapters that use Auth0 Token Vault

Simple rule:
- if it is generic autonomous infrastructure, it belongs to OpenClaw
- if it exists because Authrix is a startup operations product, it belongs to Authrix

## Product Layers

Authrix should be built as four clear layers.

### 1. Runtime Foundation

The runtime layer provides:
- persistent execution
- background processing
- tool and workflow execution
- autonomous task handling

This layer should remain generic.

### 2. Product Backend

This is the real application layer of Authrix.

It should own:
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

This is where Authrix becomes a product instead of a wrapper.

### 3. Security and Identity

Auth0 Token Vault should be the only trusted path for delegated third-party access.

Security rules:
- agents never hold raw credentials
- agents never directly manage OAuth tokens
- all external actions pass through a mediated backend layer
- approvals are enforced by product policy, not by UI copy alone
- sensitive writes must be auditable

### 4. Control Tower

The frontend should act as a live operational surface for the team.

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

## Agent Model

Authrix should use specialized peer agents coordinated by backend and product logic.

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

## Control Tower Experience

The initial product should balance two modes.

### Chat-first requests

Examples:
- "Summarize this week's engineering progress"
- "Turn this meeting into notes and follow-ups"
- "Why did our costs spike?"

### Oversight-first control tower

The web app should let a team inspect:
- what the system observed
- what each agent concluded
- what actions are pending
- what was approved
- what changed over time

That combination is central to the Authrix identity.

## Implementation Principles

Implementation should follow these principles:
- keep domain types explicit
- prefer simple functions over orchestration frameworks
- use mock data first when a real integration is not yet stable
- preserve clear boundaries between runtime, backend, agents, and UI
- avoid unnecessary libraries
- keep all important outputs structured
- optimize for believable product leverage over feature count

## Branching and Collaboration Model

Authrix should use a disciplined branching workflow even if contributors work fluidly across the same parts of the codebase.

### Main branches

- `main`: stable, review-ready, releasable
- `dev`: shared integration branch

### Feature branch rules

All meaningful work should happen in feature branches created from `dev`.

Recommended examples:
- `feat/openclaw-runtime-bridge`
- `feat/control-tower-ui`
- `feat/github-ingestion`
- `feat/engineering-agent`
- `feat/docs-agent`
- `feat/workflow-agent`
- `feat/devops-agent`
- `feat/auth0-token-vault`
- `feat/approval-engine`
- `feat/audio-processing`

### Workflow

Recommended flow:
1. update local `dev`
2. create a focused feature branch
3. make one coherent set of changes
4. commit with a clear message
5. open a PR into `dev`
6. merge `dev` into `main` only when stable

Branching is not about ownership boundaries between teammates. It is about keeping changes isolated, understandable, and safe to review.

## Initial Phase Implementation Plan

### Phase 0: Foundation and Alignment

Goal:
- align the repo with the current product vision before code spreads

Deliverables:
- implementation blueprint
- clarified runtime/product boundary
- initial typed domain model outline
- agreed branch strategy
- decision on what is mocked first

### Phase 1: Product Shell and Professional UI

Goal:
- create the first believable control tower experience

Deliverables:
- Next.js app shell
- routes for Dashboard, Connections, Activity, Tasks, and Costs
- reusable cards for summary, tasks, cost/risk, approvals, and timeline
- polished loading, empty, and error states
- mock structured records wired into the UI

### Phase 2: Core Product Backend and Agent Contracts

Goal:
- make the product real at the data-model level

Deliverables:
- shared types for records and agent inputs/outputs
- backend routes or server actions for product state
- pure-function implementations for Engineering, Docs, Workflow, and DevOps agents
- persistent or mock-backed record generation
- agent outputs displayed in the control tower

### Phase 3: First Real Integration Path

Goal:
- replace one mock path with a real source of truth

Deliverables:
- GitHub integration
- normalized engineering activity pipeline
- Engineering Agent output from real repository activity
- downstream task generation and timeline updates

### Phase 4: Approval Engine

Goal:
- establish a real trust model early

Deliverables:
- typed proposed-action model
- approval queue UI
- risk classification model
- mediated action execution flow
- audit entries for action lifecycle

### Phase 5: Runtime and Identity Integration

Goal:
- connect Authrix product behavior to real autonomous and delegated execution

Deliverables:
- OpenClaw runtime bridge
- Auth0 Token Vault integration
- secure backend execution adapters
- approval-aware external action flow
- auditability around delegated actions

### Phase 6: Docs, Meeting, and Workflow Depth

Goal:
- expand from engineering intelligence into broader operational intelligence

Deliverables:
- manual meeting upload flow
- transcription and extraction pipeline
- Docs Agent outputs for notes and decision logs
- Workflow Agent outputs for ownership and follow-up tracking
- cross-linking between meetings, tasks, decisions, and engineering work

## Immediate Next Inputs Needed

To move from blueprint to implementation, the next inputs that matter most are:
- the OpenClaw repository or runtime code being used
- the desired real-vs-mocked scope for the first build pass
- any design references for the control tower
- the preferred first feature branch to open from `dev`

Until the runtime integration is reviewed, this document should act as the implementation source of truth for the project direction.
