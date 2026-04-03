# Authrix Autonomy Implementation Plan

This document resets the implementation plan around one product definition:

Authrix is the fifth worker in a startup team.

It is not just a dashboard, not just a router, and not just a bundle of summary cards.
It should behave like a persistent autonomous startup operator that can think, act, ask for clarification when needed, and carry work through to real outcomes.

## Product Definition

Authrix should present as one product with four user-facing specialists:

- Engineer
- Docs
- Workflow
- Finance

Internally, Authrix can keep helper agents and background workers, but the user-facing product should feel like one teammate with clear specialist identities.

## What "True Autonomy" Means Here

For Authrix, autonomy means all of the following are true:

- a user can start work from Slack or the web
- the request is attached to a persistent session, not treated as a stateless prompt
- the agent can inspect the relevant system before acting
- the agent can form and revise a plan during execution
- the agent can ask follow-up questions when required, but does not block on every small ambiguity
- the agent can use tools, produce artifacts, and continue asynchronously
- the agent remembers prior context through session logs and product memory
- the agent can propose or execute real actions through mediated adapters
- all meaningful actions are visible in the control tower and audit trail

What does not count as autonomy:

- keyword routing with canned acknowledgements
- read-only summary generation without execution
- a dashboard that only shows mock records
- one-shot LLM calls with no persistent session or follow-through

## The Four Core Product Flows

### 1. Engineer Flow

User story:
- a software engineer messages Authrix in Slack and says, "In the GitHub org, switch the logo for this one," or "Streamline the backend auth flow."

Expected behavior:

- Authrix routes the thread to the Engineer specialist
- the Engineer session inspects the target repository
- it asks clarifying questions only when necessary
- it creates a task plan
- it edits code in an isolated workspace
- it runs checks
- it summarizes what changed
- it proposes a draft PR or other mediated GitHub write
- approval is required before any external write

Definition of done:
- a Slack request can become a real code change and a draft PR, not just a suggested task

### 2. Docs Flow

User story:
- a founder or operator uploads an audio file from a team meeting

Expected behavior:

- Authrix transcribes the audio
- the Docs specialist creates structured meeting notes
- decisions, action items, and open questions are extracted
- Authrix can ask whether the notes should be handed to Workflow
- the artifact is stored in shared memory and linked to the workspace

Definition of done:
- audio upload becomes a durable meeting artifact and can trigger downstream workflows

### 3. Workflow Flow

User story:
- a founder forwards docs output through Slack and says, "Do the workflow work, set deadlines, assign owners, make tickets."

Expected behavior:

- Authrix converts notes into tracked work
- owners and due dates are proposed or inferred
- GitHub issues or other tickets are prepared through mediated write adapters
- reminders and follow-through are scheduled
- the control tower shows task state, ownership, and drift

Definition of done:
- meeting outputs become accountable work, not just text summaries

### 4. Finance Flow

User story:
- a founder asks why API spend changed or what the control tower spend card means

Expected behavior:

- Authrix loads live usage and billing signals
- the Finance specialist explains the numbers in plain language
- it links costs back to engineering and operational activity
- it flags anomalies and suggests next steps

Definition of done:
- spend questions are answered from real data with evidence, not mock prose

## Current Truth

The current repo is a strong control-tower foundation, but it is not yet a true autonomous worker.

Today Authrix can:

- authenticate users with Auth0
- ingest GitHub activity in a live or fallback mode
- persist a workspace snapshot
- generate engineering, docs, workflow, task, and cost outputs
- capture Slack messages and route them to an internal specialist label
- queue approval records
- execute a small mediated write surface for `github.issue.create` and `docs.update`

Today Authrix cannot yet:

- bind a Slack thread to a real long-running agent session
- run a real multi-turn autonomous coding loop against a repository
- create branches, commits, or PRs through a mediated GitHub executor
- transcribe uploaded meeting audio
- hand Docs output into Workflow as a live autonomy chain
- answer finance questions from live billing providers
- persist true session memory in the way OpenClaw does
- operate proactive long-running agent jobs beyond the current lightweight job layer

The implementation plan below is designed to close exactly those gaps.

## Reuse Strategy From The Local `openclaw/` Codebase

Authrix should not reinvent generic agent runtime infrastructure that already exists locally under MIT-licensed OpenClaw code.

The reusable surfaces already present in this repository include:

- `openclaw/src/gateway`
  Gateway control plane, agent call loop, auth, boot, and runtime transport
- `openclaw/src/sessions`
  Session lifecycle, session keys, transcript events, labels, and send policies
- `openclaw/src/channels`
  Conversation binding, thread/session mapping, routing helpers, and chat-state primitives
- `openclaw/src/process`
  Controlled exec and command queue utilities
- `openclaw/src/security`
  Audit, policy, and dangerous-config guardrail logic
- `openclaw/src/cron`
  Scheduled work foundation
- `openclaw/packages/memory-host-sdk`
  Candidate base for a real Authrix memory-host integration

Authrix should wrap these behind Authrix-owned interfaces and naming.

Product rule:

- OpenClaw is the internal runtime lineage
- Authrix is the product

## Target Architecture

### 1. Channel Layer

Inputs:

- Slack as the first-class operating surface
- web uploads for files and control-tower actions

Responsibilities:

- turn inbound messages into persistent Authrix sessions
- preserve thread identity
- display specialist identity in replies
- support approvals and follow-up actions from the same thread

### 2. Authrix Runtime Layer

Responsibilities:

- own session creation, listing, history, and background execution
- execute agent loops with tool access
- stream intermediate progress
- maintain durable transcripts
- expose health and control APIs to the Authrix product layer

Implementation rule:

- `lib/runtime/*` in the product should become a thin boundary over a real Authrix worker service backed by OpenClaw-derived infrastructure

### 3. Product Memory Layer

Responsibilities:

- store session transcripts and compact summaries
- store durable workspace facts, decisions, tasks, repos, approvals, and spend artifacts
- allow cross-agent retrieval without dumping raw context everywhere

Implementation rule:

- structured workspace records remain the canonical source of truth
- memory adds session continuity and retrieval, not a replacement for product records

### 4. Integration and Tool Layer

Responsibilities:

- GitHub read and write adapters
- repository checkout and branch workspace management
- docs transcription and artifact generation
- task/ticket adapters
- finance and billing data adapters

Implementation rule:

- all privileged external actions stay mediated
- all host-level actions stay sandboxed and scoped

### 5. Approval and Safety Layer

Responsibilities:

- classify actions by risk tier
- require approval before external writes
- preserve auditable provenance
- keep engineer autonomy powerful without giving it invisible write authority

## Execution Model For Each Specialist

### Engineer

Primary tools:

- repo checkout manager
- git read tools
- scoped file edit tools
- test/build runners
- GitHub branch, PR, and comment adapters

Success condition:
- completes an inspect -> plan -> edit -> validate -> propose/explain loop

### Docs

Primary tools:

- file upload intake
- audio transcription
- note extraction and formatting
- artifact persistence
- optional handoff to Workflow

Success condition:
- transforms raw meeting material into durable structured knowledge

### Workflow

Primary tools:

- task extraction
- owner and deadline inference
- issue/ticket creation adapters
- reminders and scheduled follow-through
- drift detection against open work

Success condition:
- turns decisions into accountable execution

### Finance

Primary tools:

- spend and usage ingestion
- anomaly detection
- cross-linking spend to product activity
- explanation and recommendation generation

Success condition:
- explains real cost posture and suggests action

## Implementation Phases

### Phase 0: Honest Reset

Goal:
- make the repo honest about current capability before expanding it

Deliverables:

- this plan
- a current-state capability matrix
- removal of any roadmap language that implies autonomy is already complete
- explicit distinction between "control tower foundation" and "autonomous worker"

Definition of done:
- engineering decisions are based on actual runtime capability, not optimistic status labels

### Phase 1: Real Authrix Worker Runtime

Goal:
- replace the current mostly thin runtime bridge with a real long-running worker runtime

Deliverables:

- Authrix worker process backed by OpenClaw-derived gateway/session infrastructure
- live session create/list/history APIs
- durable transcript storage
- background agent runs with status tracking
- runtime health, restart, and failure-state visibility in the control tower

Definition of done:
- a single Authrix session can live across multiple Slack or web interactions

### Phase 2: Slack Thread To Session Binding

Goal:
- make Slack the real operating surface, not just a message inbox

Deliverables:

- one Slack thread maps to one Authrix session
- explicit specialist routing with session reuse
- progress updates and clarifying questions posted back into the same thread
- interactive approval actions from Slack
- session history visible in the control tower

Definition of done:
- an operator can start work in Slack, leave, return later, and continue the same agent thread

### Phase 3: Engineer Autonomy

Goal:
- make the Engineer specialist a real coding worker

Deliverables:

- repository selection and repo-binding model
- isolated checkout workspace per task or session
- real coding loop with inspect, edit, test, and retry
- draft PR creation adapter
- approval-gated GitHub writes for branch push, issue creation, PR creation, merge, and comments
- persisted engineering run records, diffs, and test output summaries

Definition of done:
- a Slack request like "swap the logo" or "streamline the backend" can produce a draft PR with explanation and validation results

### Phase 4: Docs Audio Pipeline

Goal:
- make Docs a real meeting intelligence worker

Deliverables:

- audio upload endpoint
- transcription service integration
- structured meeting note generation
- decision and action-item extraction
- optional handoff action to Workflow

Definition of done:
- uploaded meeting audio becomes a durable meeting artifact and can feed downstream work

### Phase 5: Workflow Execution

Goal:
- make Workflow a real follow-through system instead of a suggestion generator

Deliverables:

- conversion of docs artifacts into tracked tasks
- owner and deadline assignment
- GitHub issue creation adapter for follow-up work
- reminder and stale-work follow-up jobs
- approval-aware ticket execution

Definition of done:
- forwarded docs output becomes tasks with real ownership and mediated ticket creation

### Phase 6: Finance Agent

Goal:
- make the current DevOps/cost surface answer real founder questions

Deliverables:

- rename the user-facing surface to Finance or Finance/Ops
- live spend ingestion from the first real billing sources
- model/API spend accounting
- operational anomaly explanations tied back to workspace activity
- chat-native Q and A with source-backed answers

Definition of done:
- a founder can ask a spend question in Slack or the control tower and get a useful evidence-backed answer

### Phase 7: Shared Memory And Proactive Autonomy

Goal:
- make Authrix persistent and proactive across days, not just reactive inside one request

Deliverables:

- session compaction and memory retrieval
- durable workspace memory shared across specialists
- proactive reminders, digests, and follow-up jobs
- cross-agent handoff records
- background execution history and resumable runs

Definition of done:
- Authrix can remember, follow up, and continue work like a teammate rather than a stateless assistant

## Safety Model For Autonomous Execution

To preserve the original product constraint that write actions require explicit approval, Authrix should adopt these execution tiers:

- Read-only intelligence
  Allowed without approval
- Product-state writes
  Allowed through typed backend services
- External writes
  Approval required
- Host-level execution
  Strongly sandboxed, scoped, and audited

For the Engineer flow, this means:

- analysis, planning, local sandbox edits, and test runs can happen autonomously
- any external GitHub write such as branch push, PR creation, issue creation, comment posting, or merge requires explicit approval

This keeps Authrix powerful without silently acting outside operator control.

## Immediate Build Order

If the goal is to make Authrix feel real fast, the order should be:

1. Engineer autonomy end-to-end from Slack request to draft PR
2. Slack thread/session binding and Slack-native approvals
3. Shared session memory and transcript history
4. Docs audio upload and transcription
5. Workflow execution and follow-through jobs
6. Finance/Ops live spend ingestion

Why this order:

- the Engineer flow is the sharpest proof of "fifth worker" value
- Slack is the real interaction surface
- memory is what makes the system feel persistent rather than stateless

## Recommended Branch Plan

Suggested feature branches for the next build cycle:

- `feat/runtime-openclaw-core`
- `feat/slack-session-binding`
- `feat/engineer-github-execution`
- `feat/slack-approval-actions`
- `feat/shared-memory-runtime`
- `feat/docs-audio-transcription`
- `feat/workflow-execution`
- `feat/finance-live-costs`

## Definition Of Done For Authrix V1 Autonomy

Authrix can be called a true autonomous startup worker when all of the following are true:

- a Slack thread opens a persistent Authrix work session
- the requested specialist can inspect live systems before acting
- the specialist can carry work through multiple tool steps without human micromanagement
- intermediate reasoning is turned into visible plans, progress, and artifacts
- memory persists across turns and across days
- approvals gate all external writes
- the control tower reflects the real state of sessions, tasks, approvals, artifacts, and outcomes
- at least one engineer request can reliably become a tested draft PR

That is the milestone this repo should now optimize for.
