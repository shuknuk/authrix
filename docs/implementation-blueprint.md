# Authrix Implementation Blueprint

This document is the implementation-facing product blueprint for Authrix.

It is written for the real product path, not a temporary demo path. Authrix can still use mocks and fixtures during development, but mocks are only acceptable as explicit fallback or developer tooling. They are not the target architecture.

## Product Definition

Authrix is a secure autonomous operations platform for startup teams.

Its purpose is to turn scattered activity across engineering work, meetings, documentation, ownership, and operational signals into structured, auditable action.

Authrix is not:
- a generic chatbot
- a one-off automation script
- a fake multi-agent demo
- a dashboard with AI pasted on top
- a thin wrapper around an open-source runtime

Authrix is:
- a startup operations product with its own product logic
- a control tower for visibility, approvals, and auditability
- a secure delegated-action layer over real third-party systems
- a structured memory and accountability system
- a product backed by an autonomous runtime foundation

## Runtime Foundation

Authrix is built on top of OpenClaw, an open-source MIT-licensed autonomous runtime.

That is a practical engineering decision. OpenClaw gives Authrix a foundation for persistent execution, agent sessions, background jobs, tool routing, and long-running autonomous behavior so Authrix can focus on its actual product value.

### What the runtime provides

- persistent execution
- background processing
- session lifecycle
- message-driven agent runs
- tool and provider routing
- runtime-level job coordination

### What Authrix provides

- workspace and team state
- normalized product records
- specialized startup operations agents
- integration adapters
- approvals and policy enforcement
- explainability and auditability
- the control tower UI
- product rules for ownership, decisions, and operational drift

### The boundary

- if it is generic autonomous infrastructure, it belongs to the runtime
- if it exists because Authrix is a startup operations product, it belongs to Authrix

Authrix should never be tightly coupled to OpenClaw internals. It should talk to the runtime through a stable adapter boundary.

## Real-Product Development Principles

The project should now follow a real-product mindset:

- real identity before fake trust
- real source systems before large fake datasets
- real runtime boundaries before hand-wavy orchestration
- real persistence before complicated product automation
- real approvals before real external writes
- clear fallback modes instead of pretending a live path exists

This changes how phases are evaluated:
- a phase is not complete just because the UI exists
- a phase is complete when the product surface is backed by real infrastructure or by an intentionally temporary fallback with a clear migration path

## Runtime Bridge

Authrix communicates with the runtime through a typed runtime bridge. This is the most important architectural seam in the system.

The bridge should cover:

```ts
interface RuntimeBridge {
  getStatus(): Promise<RuntimeStatus>
  executeAgent(input: AgentExecutionRequest): Promise<AgentExecutionResult>
  createSession(config: SessionConfig): Promise<Session>
  getSession(sessionId: string): Promise<Session | null>
  listSessions(): Promise<Session[]>
  invokeTool(request: ToolInvocation): Promise<ToolResult>
  submitJob(request: BackgroundJobRequest): Promise<string>
  getJobStatus(jobId: string): Promise<JobStatus>
}
```

Important rule:
- Authrix product code should only know the bridge
- OpenClaw-specific details should stay inside the OpenClaw adapter

The mock bridge may still exist for local development and failure fallback, but the target path is a live runtime adapter.

## Product Layers

Authrix is built as four clear layers.

### 1. Runtime Foundation

OpenClaw handles:
- long-running execution
- background jobs
- session lifecycle
- tool routing
- autonomous runtime behavior

### 2. Product Backend

The Authrix backend is the application brain. It owns:
- workspace state
- normalized records
- source ingestion
- product routing
- approval handling
- audit history
- risk classification
- agent output persistence
- integration adapters
- control-tower-facing data services

### 3. Security and Identity

Auth0 and Token Vault are part of the real product architecture now, not a future add-on.

Security rules:
- agents never hold raw credentials
- agents never directly own OAuth tokens
- all third-party access flows through a mediated backend layer
- all write actions are approval-aware
- sensitive actions must be auditable

### 4. Control Tower

The frontend is not just a demo shell. It is the operating surface of the product.

It should expose:
- integration state
- runtime state
- source activity
- agent outputs
- approvals
- tasks and ownership
- costs and risk
- timeline and audit history

## Agent Model

Authrix uses specialized peer agents coordinated by backend logic and shared product state.

There is no fake master agent.

### Engineering Agent

Inputs:
- GitHub activity
- pull requests
- commits
- issues
- deployment-related engineering metadata when available

Responsibilities:
- summarize technical work
- identify notable changes
- flag technical risk
- translate raw engineering activity into readable operational output

### Docs Agent

Inputs:
- meeting transcripts
- uploaded audio after transcription
- notes
- sync summaries
- engineering summaries
- manual prompts

Responsibilities:
- create meeting notes
- record decisions
- maintain durable knowledge artifacts
- capture what happened and what should persist

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
- detect accountability gaps
- track unresolved work

### DevOps Agent

Inputs:
- billing and usage signals
- token usage
- infrastructure usage
- deployment context
- other cost signals

Responsibilities:
- summarize spend and operational health
- detect anomalies
- correlate operational drift with product activity
- surface risk

## Shared Product Records

Authrix should rely on structured records, not loose text blobs.

The canonical records should include:
- `Workspace`
- `IntegrationStatus`
- `SourceEvent`
- `SourceDocument`
- `EngineeringActivity`
- `EngineeringSummary`
- `MeetingArtifact`
- `DecisionRecord`
- `SuggestedTask`
- `CostReport`
- `RiskAlert`
- `ProposedAction`
- `ApprovalRequest`
- `AuditEvent`
- `AgentRunRecord`
- `TimelineEntry`

Real-product rule:
- if a page matters, it should read from shared product records
- if an agent output matters, it should become a stored or persistence-ready record
- if an action matters, it must be visible in approvals and audit history

## Approval and Action Model

Read-only intelligence can run freely.

External writes must become proposed actions before execution.

Each proposed action should carry:
- action kind
- source context
- target system
- risk level
- explanation
- approval state
- execution outcome

Risk model:
- low risk: summaries, read-only analysis, passive detection
- medium risk: shared updates, created tasks, draft changes
- high risk: sensitive writes and actions with important workspace consequences

Authrix should never claim secure behavior that is not actually implemented.

## Development Priorities

The product priorities are now:

1. real identity and secure connection boundaries
2. canonical product records and backend services
3. first live external source of truth
4. live runtime adapter and runtime health visibility
5. durable persistence and background execution
6. mediated approval-backed writes
7. UI polish on top of live behavior

This means:
- Auth0 is not deferred
- the runtime adapter is not deferred
- GitHub is not just a mock integration
- persistence is required before calling the infrastructure layer complete

## Branching and Collaboration Model

Authrix should keep a disciplined branching workflow.

### Main branches

- `main`: stable and demo-safe
- `dev`: shared integration branch

### Feature branches

Feature branches should represent one coherent change. Examples:
- `feat/auth0-integration`
- `feat/github-live-ingestion`
- `feat/runtime-adapter`
- `feat/workspace-persistence`
- `feat/approval-execution`
- `feat/control-tower-runtime-status`

### Workflow

Recommended flow:
1. update local `dev`
2. create a focused feature branch
3. make one coherent change
4. commit clearly
5. merge into `dev`
6. promote to `main` only when stable

## Updated Implementation Phases

The phases below replace the original mock-first interpretation.

### Phase 0: Product Alignment and Architecture Boundary

Goal:
- lock the real product thesis before code spreads

Deliverables:
- canonical product vision
- clear OpenClaw vs Authrix boundary
- clear Auth0 and Token Vault role
- branch strategy
- canonical record model

Status:
- complete

### Phase 1: Real Product Shell and Canonical State

Goal:
- build the actual product surface and shared backend contracts

Deliverables:
- Next.js app shell and real page structure
- typed domain records
- typed agent contracts
- shared workspace snapshot shape
- control tower sections for summary, tasks, costs, approvals, activity, and connections
- product routes that serve shared state instead of page-local mock logic

Definition of done:
- all major pages render from shared product state
- the system has one clear data model
- the UI is a real product shell, not disconnected screens

Status:
- complete in foundation form

### Phase 2: Security and Product Backend Foundation

Goal:
- make Authrix a real secured application, not just a local prototype

Deliverables:
- Auth0 login and protected routes
- secure backend mediation boundaries
- approval and proposed-action model
- product-level agent contracts
- runtime abstraction layer
- secure integration architecture that keeps credentials out of agents

Definition of done:
- login is real
- core routes are protected
- actions and approvals are modeled as real backend concerns
- the product has a believable trust model

Status:
- complete in foundation form

### Phase 3: First Live Source of Truth

Goal:
- replace the first mock path with a real external source

Deliverables:
- GitHub live ingestion
- normalized engineering activity from a real repository
- Auth0 connected-account path for GitHub
- real integration status in the control tower
- product data services that can prefer live data and fall back honestly

Definition of done:
- Authrix can connect to GitHub
- real engineering activity can enter the product
- the system no longer depends entirely on seeded engineering data

Status:
- complete in hybrid form

Note:
- hybrid means the live path exists, but parts of downstream product behavior still use local deterministic agent logic and seeded records

### Phase 4: Real Autonomous Product Infrastructure

Goal:
- make the backend and runtime layer real enough that the rest of the product can build on it without architectural rework

This is the infrastructure milestone that turns Authrix from a hybrid prototype into a real product foundation.

Deliverables:
- live OpenClaw runtime adapter through the runtime bridge
- runtime provider selection and health/status visibility
- runtime-backed session creation and session inspection
- runtime-backed execution path for at least one real Authrix agent flow
- durable persistence for workspace records, agent runs, approvals, and timeline entries
- background refresh and ingestion jobs through a real job path
- removal of seeded/mock workspace assembly as the default product path
- explicit mock mode only as fallback or developer mode
- approval-backed mediated write execution path ready for real integrations

Definition of done:
- a user can log into Authrix
- connect GitHub through Auth0
- ingest real engineering activity
- persist product records in a durable store
- execute at least one real product agent flow through the runtime
- inspect runtime status from the control tower
- see approvals, tasks, and timeline entries built from persisted product state
- continue operating without relying on seeded mock workspace state as the primary path

This is the key Phase 4 principle:
- at the end of Phase 4, Authrix should have real product infrastructure ready for deeper feature expansion

### Phase 5: Real Product Expansion

Goal:
- expand the live product into the rest of the operational surface

Deliverables:
- docs and meeting pipeline on real persisted records
- workflow ownership and follow-up on live data
- devops and cost ingestion on live data
- richer approval execution
- additional integrations beyond GitHub

## What Changes Now

The roadmap now assumes:
- the real product path is the default path
- mocks are only fallback tools
- earlier phases are considered complete only in foundation terms
- Phase 4 is where Authrix stops being mainly a well-structured prototype and becomes real product infrastructure

That means the next implementation work inside Phase 4 should focus on:
- persistent storage
- runtime-backed execution for a real agent pipeline
- live background sync/refresh
- eliminating seeded workspace assembly as the default backend path

## Current Status

Current status under the real-product interpretation:

- Phase 0: complete
- Phase 1: complete in foundation form
- Phase 2: complete in foundation form
- Phase 3: complete in hybrid form
- Phase 4: complete

Authrix now has a persistence-backed, runtime-aware, approval-capable product foundation that is ready for deeper product expansion.
