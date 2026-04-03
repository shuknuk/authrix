# Authrix Implementation Blueprint

This document is the implementation-facing product blueprint for Authrix.

Status note:
- the phase status language in this document is now too optimistic for the current "true autonomy" goal
- use [docs/autonomy-implementation-plan.md](./autonomy-implementation-plan.md) as the active roadmap for turning Authrix into a real autonomous startup worker

It reflects the real product path. Mock data and local fallbacks are allowed during development, but they are not the target architecture. Authrix is being built as a real startup operations product with its own runtime identity, backend rules, security model, and control tower.

## Product Definition

Authrix is a secure autonomous operations platform for startup teams.

Its job is to turn scattered activity across engineering, meetings, documentation, ownership, and operational signals into structured, auditable action.

Authrix is not:
- a generic chatbot
- a one-off automation script
- a fake multi-agent demo
- a dashboard with AI pasted on top
- a thin wrapper around somebody else's runtime

Authrix is:
- a startup operations product with its own logic and control surface
- a secure delegated-action system over real third-party tools
- a shared memory and accountability layer for lean technical teams
- a product backed by an internal autonomous runtime engine

## Runtime Foundation

Authrix has its own runtime layer inside the product architecture.

That runtime layer is being built by reusing and adapting proven OpenClaw runtime infrastructure under the MIT license. That lineage should be credited in repository and legal materials, but it is not part of the product narrative or user-facing architecture. Users adopt Authrix, not "OpenClaw compatibility."

The practical reason for this approach is straightforward: persistent execution, background jobs, session handling, and tool routing are hard infrastructure problems that do not need to be reinvented if trusted open-source runtime code already exists.

### What the runtime layer provides

- persistent execution
- background processing
- session lifecycle
- message-driven agent runs
- tool and provider routing
- long-running autonomous behavior

### What Authrix provides

- workspace and team state
- normalized product records
- startup-specific agents
- integration adapters
- approvals and policy enforcement
- explainability and auditability
- the control tower UI
- product rules around ownership, decisions, drift, and operational risk

### The product boundary

- if it is generic autonomous infrastructure, it belongs to the internal runtime layer
- if it exists because the product is Authrix, it belongs to the Authrix product layer

Even though Authrix is reusing proven runtime code, product modules should still depend on a stable runtime boundary rather than reaching into runtime internals directly. That keeps the product readable and keeps the runtime lineage private.

## Real-Product Development Principles

The project should follow a real-product mindset:

- real identity before fake trust
- real source systems before large fake datasets
- real persistence before complicated automation
- real approvals before real external writes
- real runtime behavior before claiming autonomy
- explicit fallback modes instead of pretending a live path exists

This changes how phases are evaluated:
- a phase is not complete just because the UI exists
- a phase is complete when the product surface is backed by real infrastructure or an honest fallback with a clear migration path

## Security Hardening Principles

Authrix should treat host security and runtime guardrails as product requirements, not optional polish.

Security priorities beyond OAuth:
- dedicated worker-machine deployment should be the preferred operating model
- Auth0 and Token Vault should handle delegated identity and token custody
- sandbox boundaries should constrain host-level execution
- approvals should guard external writes and high-risk host actions
- tool execution should move toward least privilege, allowlists, and path-scoped access

Important rule:
- Auth0 secures delegated access to external systems
- sandboxing, backend mediation, and host isolation secure the runtime and the machine

## Runtime Boundary

Authrix product code should talk to the runtime through a typed internal boundary.

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
- runtime-lineage-specific details should stay inside the internal runtime layer

Mock and deterministic local implementations can still exist for development and fallback, but the product target is a live Authrix-owned runtime engine.

## Product Layers

Authrix should be built as four clear layers.

### 1. Internal Runtime Layer

The runtime layer handles:
- long-running execution
- background jobs
- session lifecycle
- tool routing
- provider routing
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

Auth0 and Token Vault are part of the real product architecture.

Security rules:
- agents never hold raw credentials
- agents never directly own OAuth tokens
- all third-party access flows through a mediated backend layer
- all write actions are approval-aware
- sensitive actions must be auditable

Deployment and hardening rules:
- dedicated worker-box deployment is the preferred trust boundary
- personal laptops are not the primary target deployment model
- host-level execution should be sandboxed or heavily constrained
- product data paths should stay separated from arbitrary host paths

### 4. Control Tower

The frontend is the operating surface of the product.

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

The intended operating model is not "one magical agent that shape-shifts into everything."

It is:
- multiple named product agents
- one shared workspace and memory layer
- role-specific instructions and structured outputs
- per-agent default model assignments
- optional delegation to sub-agents when a task needs a different model, capability, or cost profile

The control tower remains the oversight surface, but the long-term operating feel should be closer to "texting a startup operations team" than clicking isolated dashboard widgets.

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

## Messaging and Agent Identity Model

Authrix should support a professional messaging surface as a first-class product input.

Recommended first messaging platform:
- Slack

Reason:
- it is already used heavily by startups
- threaded conversations map well to agent work
- channels, DMs, and mentions provide flexible operating patterns
- it fits the "startup teammate" mental model better than consumer-first messaging tools

The initial messaging design should be:
- one Authrix Slack app
- one product-facing bot presence
- internal routing to specialized agents
- explicit agent identity shown in replies

The first version should not require four separate Slack bots.

That can come later if it proves useful, but the clean v1 product is:
- one Authrix bot in Slack
- one shared workspace
- one central control tower
- internal multi-agent routing behind the scenes

When Authrix replies in chat, the system should make the responding agent visible:
- `Engineer`
- `Docs`
- `Workflow`
- `DevOps`

This preserves the "team of agents" feel without creating unnecessary channel or bot sprawl.

## Model Routing and LLM Strategy

Authrix should not market or implement a fake "switch models magically" feature.

Instead, the model system should be explicit and role-based:
- each agent has a default model
- a lightweight router can classify a request before execution
- tasks may delegate to a sub-agent or a different model only when needed

The initial LLM layer should be provider-backed and configurable, with Ollama Cloud as the first real target.

Recommended initial model posture:
- `Engineer`: premium reasoning model by default
- `Docs`: fast mid-tier model by default
- `Workflow`: fast mid-tier model by default
- `DevOps`: stronger analytical model by default

Recommended routing behavior:
- simple formatting, status updates, and low-risk summaries -> cheaper fast model
- code reasoning, technical investigation, architecture, and debugging -> stronger reasoning model
- ambiguous requests -> classify first, then route
- mixed requests -> split into per-agent work items

Important rule:
- model routing is a product concern
- provider-specific APIs belong behind a clean provider adapter
- agent modules should ask for capabilities, not hardcode transport logic everywhere

## Shared Workspace and Multi-Agent Memory

All specialized agents should operate over the same Authrix workspace state.

That means:
- one shared product memory
- one shared record system
- one shared decision/task/timeline surface
- agent-specific identities layered on top of the same operational context

This is a key part of the product feeling coherent.

The user should not feel like they are talking to four disconnected bots.

They should feel like:
- one startup operations system
- with distinct internal specialists
- all aware of the same workspace reality

## Provider and Routing Boundary

The LLM layer should be introduced through a provider adapter rather than directly wiring agent code to one API.

The first real provider target should be:
- Ollama Cloud

The abstraction should be able to grow later to support:
- alternate hosted providers
- internal runtime-managed model calls
- per-agent provider overrides

Suggested interface shape:

```ts
interface ModelProvider {
  chat(request: ModelChatRequest): Promise<ModelChatResponse>
}

interface AgentModelRegistry {
  getDefaultModel(agentId: AuthrixAgentId): string
  getExecutionProfile(agentId: AuthrixAgentId): ExecutionProfile
}

interface AgentRouter {
  classify(request: IncomingMessage): Promise<RouteDecision>
  selectAgent(decision: RouteDecision): AuthrixAgentId
  selectModel(decision: RouteDecision, agentId: AuthrixAgentId): string
}
```

Important rule:
- per-agent model defaults should live in one central registry
- routing and cost optimization should be visible and explainable
- delegated sub-agent work should be explicit in logs and the control tower

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

The product priorities are:

1. real identity and secure connection boundaries
2. canonical product records and backend services
3. first live external source of truth
4. Authrix-owned runtime engine and runtime health visibility
5. durable persistence and background execution
6. mediated approval-backed writes
7. sandbox hardening and safe deployment posture
8. broader autonomous product depth
9. UI polish on top of live behavior

This means:
- Auth0 is not deferred
- runtime internalization is not deferred
- GitHub is not just a mock integration
- persistence is required before calling the infrastructure layer complete
- sandbox hardening is not treated as a cosmetic future enhancement

## Branching and Collaboration Model

Authrix should keep a disciplined branching workflow.

### Main branches

- `main`: stable and demo-safe
- `dev`: shared integration branch

### Feature branches

Feature branches should represent one coherent change. Examples:
- `feat/auth0-integration`
- `feat/github-live-ingestion`
- `feat/runtime-engine`
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

### Phase 0: Product Alignment and Architecture Boundary

Goal:
- lock the real product thesis before code spreads

Deliverables:
- canonical product vision
- clear Authrix-owned runtime narrative
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
- runtime abstraction boundary
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
- hybrid means the live path exists, but parts of downstream product behavior still use deterministic local logic or seeded records as fallback

### Phase 4: Authrix Runtime Engine and Durable Product Infrastructure

Goal:
- make the backend and runtime layer real enough that the rest of the product can build on them without architectural rework

This is the infrastructure milestone that turns Authrix from a hybrid prototype into a real product foundation.

Deliverables:
- an internal Authrix runtime layer backed by reused OpenClaw-derived infrastructure
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

Important clarification:
- some internal runtime modules may still preserve gateway-shaped transport or configuration naming while the reused runtime foundation is being folded more deeply into Authrix
- that is an implementation detail, not the product architecture

Status:
- complete

### Phase 5: Real Product Expansion

Goal:
- expand the live product into the rest of the operational surface

Deliverables:
- docs and meeting pipeline on real persisted records
- workflow ownership and follow-up on live data
- devops and cost ingestion on live data
- richer approval execution
- additional integrations beyond GitHub

Status:
- complete

### Phase 6: Guardrails, Sandboxing, and Safe Deployment

Goal:
- harden Authrix so the product can be run responsibly on a dedicated worker machine

Deliverables:
- documented dedicated-worker deployment model
- execution tiers for read-only, product-write, external-write, and host-level actions
- sandbox posture for runtime-backed execution
- narrowed tool allowlists and path boundaries
- explicit review of host-level write and exec paths
- safer secret and environment handling for deployed Authrix instances
- clearer runtime health and failure-state visibility for operators
- persisted security events for blocked or policy-sensitive runtime behavior

Definition of done:
- Authrix has a clear preferred deployment trust boundary
- host-level execution is no longer treated as an unbounded default
- risky runtime behavior is policy-aware and auditable
- security documentation and implementation agree on the guardrail model

Status:
- complete

### Phase 7: Functional Product Readiness

Goal:
- make Authrix installable and bring-up-ready as a real product on a worker box

Deliverables:
- end-to-end local or worker-box install flow
- stable environment setup and runbook
- startup and restart guidance
- connection onboarding for the main product path
- first real deployment smoke test checklist
- operator-visible deployment readiness and smoke-test surfaces

Status:
- complete

### Phase 8: Broader Operational Depth

Goal:
- deepen automation and product breadth after the secure deployment path exists

Deliverables:
- richer integrations
- stronger autonomy loops
- broader ops and workflow coverage
- more complete drift detection

Status:
- complete

Status:
- not started

### Phase 9A: Initial UI Polish

Goal:
- deliver a cleaner, more intentional first visual pass before deeper product-specific redesign work

Deliverables:
- upgraded shell and navigation polish
- stronger dashboard card presentation
- cleaner signed-out landing experience
- improved visual consistency across the core control-tower pages

Status:
- complete

### Phase 9B: Full Product Revamp

Goal:
- rework the visual language, onboarding, and storytelling more deeply after the product is running locally and can be evaluated as a real experience

Deliverables:
- refined control tower UX based on live usage
- improved setup guidance
- polished onboarding and marketing surfaces
- stronger product storytelling for demos and launch

Status:
- complete

### Phase 10: Slack Messaging Layer and Agent Identity Surface

Goal:
- make Authrix usable like an always-on startup teammate through a professional messaging surface

Deliverables:
- Slack app and bot integration
- inbound message handling for DMs, mentions, and threads
- message/session persistence tied to the shared Authrix workspace
- one product-facing Authrix bot with visible internal agent identity labels
- control-tower visibility into message-driven agent runs

Definition of done:
- a startup operator can message Authrix in Slack
- Authrix can route the message into the product backend
- the resulting agent run appears in the control tower
- replies visibly indicate which specialized agent handled the task

Status:
- complete

### Phase 11: Ollama Cloud Provider Layer and Model-Routed Agent Execution

Goal:
- replace deterministic local agent execution with real LLM-backed multi-agent behavior

Deliverables:
- Ollama Cloud provider adapter
- secure API key configuration and backend-only model access
- centralized per-agent model registry
- lightweight request classifier/router
- runtime-backed agent execution that calls real models through the provider layer
- cost-aware routing policy for premium vs faster/cheaper models

Definition of done:
- Engineer, Docs, Workflow, and DevOps can each execute through real LLM calls
- each agent has an explicit default model
- routing decisions are visible and explainable
- the system can classify simple vs complex work before spending on stronger models

Status:
- complete

### Phase 12: Delegation, Scheduled Work, and Chat-Native Operations

Goal:
- make Authrix behave like a true always-on operational team rather than only a request/response dashboard

Deliverables:
- optional sub-agent delegation for specialized tasks
- scheduled Slack-facing reports and proactive check-ins
- chat-native task dispatch and follow-up flows
- persisted multi-agent conversation and delegation history
- control-tower views for chat activity, delegation chains, and model spend

Definition of done:
- Authrix can proactively deliver useful operational updates in Slack
- agent delegation is visible, bounded, and auditable
- chat is a first-class operating surface alongside the control tower

Status:
- complete

## Current Status

Current status under the corrected product interpretation:

- Phase 0: complete
- Phase 1: complete in foundation form
- Phase 2: complete in foundation form
- Phase 3: complete in hybrid form
- Phase 4: complete
- Phase 5: complete
- Phase 6: complete
- Phase 7: complete
- Phase 8: complete
- Phase 9A: complete
- Phase 9B: complete
- Phase 10: complete
- Phase 11: complete
- Phase 12: complete

Authrix now has a persistence-backed, runtime-aware, approval-capable product foundation with baseline deployment guardrails, a real worker-box bring-up path, and broader operational depth through persisted drift detection, stronger autonomy recommendations, and richer cross-surface workflow and ops coverage. The reused runtime lineage remains internal to the product rather than exposed as a separate dependency narrative.

Authrix also now has:
- persisted Slack conversation history
- visible delegation chains between internal specialists
- scheduled/proactive Slack briefing records
- chat-native follow-up capture into the control tower
- model-routed chat workload visibility alongside the control tower

The next implementation track is now clear:
- richer delegation execution beyond lightweight routing
- stronger scheduled work and autonomous follow-through
- deeper Slack operator ergonomics and install flow
- fuller model usage and spend accounting
