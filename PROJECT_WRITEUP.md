# Authrix Project Writeup

## Overview

Authrix is a secure autonomous operations platform for startup teams.

It is designed for small technical teams that move fast across engineering, meetings, documentation, infrastructure, and decision-making, but struggle to preserve continuity across all of that motion. Authrix exists to turn scattered activity into structured organizational action.

This is not a generic chatbot, a narrow automation script, or a dashboard pretending to be an agent system. Authrix is a real product with its own runtime layer, product backend, approvals, auditability, and control tower.

## One-Line Pitch

Authrix is a secure autonomous operations platform that turns engineering activity, meetings, documentation, workflow signals, and operational data into structured, auditable action for startup teams.

## Core Thesis

Startups already generate the right information. They just do a poor job turning it into reliable operational action.

Important context is constantly created:
- code gets merged
- meetings happen
- decisions get made
- tasks get mentioned
- infrastructure changes
- costs move
- documentation drifts

But those signals rarely become shared memory, follow-through, or accountability. The result is familiar:
- people re-ask questions the team already answered
- nobody can summarize what changed this week
- action items remain implied instead of owned
- docs go stale
- operational risk rises quietly
- founders manually stitch together information from too many systems

Authrix exists to fix that.

## Product Positioning

Authrix is not:
- a general AI assistant
- a task manager replacement
- a note-taking app with AI attached
- an email bot
- a static dashboard
- fake agent complexity built for show
- a branded wrapper around another product

Authrix is:
- a startup operations system with its own product identity
- a multi-agent product with specialized roles
- a live control tower with approvals and auditability
- a secure delegated-action layer over real tools
- a shared memory and accountability system for a startup team
- a complete platform backed by an internal autonomous runtime engine

## Main Use Cases

Authrix should be able to help answer questions like:
- "Summarize this week's engineering progress."
- "What changed after the auth migration?"
- "Turn this meeting recording into notes and action items."
- "What decisions were made in that meeting?"
- "What follow-ups are still unowned?"
- "Why did our costs spike this week?"
- "Update the docs from today's sync."

These are operational questions that repeat constantly inside startup teams.

## Product Architecture

Authrix is made up of several layers that work together.

### 1. Input and Messaging Layer

This is how information enters the system.

Inputs may include:
- direct prompts
- GitHub activity
- meeting audio uploads
- meeting transcripts
- notes and sync summaries
- documentation pages
- deployment signals
- token usage and API billing data
- infrastructure usage metrics

Authrix is not only prompt-driven. It is designed to react to files, events, and recurring operational signals.

### 2. Autonomous Runtime Layer

Authrix includes its own autonomous runtime layer for the infrastructure side of agent execution.

That runtime layer is being built by reusing and adapting proven OpenClaw runtime infrastructure under the MIT license. That open-source lineage should be credited in repository and legal materials, but it is not part of the product narrative. Authrix is the product. The runtime implementation is an internal engineering decision.

The runtime layer handles:
- persistent execution
- background jobs
- session management
- tool routing
- provider routing
- long-running autonomous behavior

The boundary is simple:
- the runtime layer handles how agents execute
- Authrix handles what agents do, why they do it, and how outputs become trusted product behavior

### 3. Product Backend Layer

This is the real application layer of Authrix and where the product's unique value lives.

It owns:
- workspace and team state
- structured records
- agent routing and coordination
- approval policies
- audit history
- risk classification
- job tracking
- decision logging
- workflow records
- anomaly records
- integration adapters
- shared state for the control tower

This is where Authrix becomes a real product instead of a collection of AI calls.

### 4. Security and Identity Layer

Security is central to Authrix because the product is fundamentally about trusted delegated action.

Authrix is designed to use Auth0 for AI Agents and Token Vault as the delegated identity and token custody layer. That makes it possible to connect systems like GitHub, Notion, Vercel, Supabase, and chat platforms without letting agents directly hold raw credentials.

Security principles:
- scoped permissions
- encrypted token custody
- delegated access instead of hardcoded secrets
- action-level policies
- approval for sensitive writes
- full auditability

### 5. Control Tower Layer

The frontend is a Next.js web application that acts as the control tower for the system.

This is where users should be able to see:
- active jobs
- recent agent outputs
- decision logs
- pending approvals
- workflow assignments
- cost and ops alerts
- audit records
- system timeline entries
- overall workspace operational state

The product balances two modes:
- natural interaction through prompts and requests
- clear oversight through the control tower

The system should feel autonomous, but never invisible.

## What Authrix Owns

The internal runtime layer handles generic autonomous infrastructure:
- long-running execution
- session lifecycle
- background processing
- tool execution plumbing
- provider routing and model access
- generic agent loop mechanics

Authrix owns everything that makes the product unique:
- the startup operations product layer
- workspace context and structured records
- specialized agent logic
- request routing and coordination
- the approval engine
- explainability and auditability
- the control tower UI
- secure integration adapters
- product-specific rules about risk, ownership, and organizational memory

Simple rule:
- if a capability would exist in any autonomous system, it belongs to the internal runtime layer
- if it exists because the product is Authrix, it belongs to Authrix

## Agent System

Authrix uses specialized peer agents coordinated by backend and product logic.

There is no need for a fake all-knowing master agent. Coordination should happen through shared state, typed outputs, and product-level routing.

### Engineering Agent

Mission:
- turn raw engineering activity into readable operational intelligence

Inputs:
- GitHub activity
- pull requests
- commits
- issues
- optional deployment metadata

Responsibilities:
- summarize technical work
- create weekly engineering digests
- identify notable architectural changes
- flag risky technical shifts
- surface follow-up implications

Outputs:
- human-readable summaries
- technical change records
- notable change alerts

### Docs Agent

Mission:
- turn messy organizational input into durable team knowledge

Inputs:
- meeting transcripts
- uploaded audio after transcription
- notes
- sync summaries
- engineering summaries
- manual prompts

Responsibilities:
- summarize meetings
- create structured notes
- maintain decision logs
- generate durable documentation artifacts
- capture what happened and what should be remembered

Outputs:
- meeting notes
- decision records
- status summaries
- knowledge artifacts

### Workflow Agent

Mission:
- turn organizational knowledge into ownership and follow-through

Inputs:
- Docs Agent outputs
- action items
- decisions
- stale task signals
- manual instructions

Responsibilities:
- identify next steps
- suggest owners
- attach due dates when available
- track unresolved work
- surface accountability gaps

Outputs:
- structured task suggestions
- owner proposals
- follow-up lists
- accountability alerts

### DevOps Agent

Mission:
- watch operational health, cost behavior, and infrastructure drift

Inputs:
- API billing data
- token usage
- Vercel usage
- Supabase usage
- deployment context
- other cost-related signals

Responsibilities:
- monitor usage and spend patterns
- detect anomalies
- produce operational summaries
- correlate spend changes with engineering activity
- identify risk signals

Outputs:
- cost summaries
- usage summaries
- anomaly alerts
- operational risk records

## Agent Coordination Model

Authrix uses specialized peer agents, not a hierarchical agent tree.

The backend coordinates how product behavior comes together:
- which agent to run
- which normalized input to provide
- how outputs are stored
- how outputs are displayed
- when follow-up work should be proposed
- when approval is required

This keeps the architecture grounded and makes the product easier to debug, reason about, and extend.

## Shared Product Capabilities

These are cross-agent system capabilities, not separate agents.

### Structured Decision Log

Decision records should capture:
- the decision itself
- date and source
- participants
- supporting context
- linked follow-up tasks
- affected systems
- current status

This gives the product real organizational memory.

### Approval Engine

Authrix should not treat every action equally.

Actions should be classified by risk:
- low risk: read-only analysis and summaries
- medium risk: shared updates that may require approval
- high risk: sensitive writes or actions with meaningful workspace consequences

This is essential to trust.

### Shared Event Timeline

All meaningful product events should feed into one common history.

Examples:
- pull request merged
- meeting summarized
- decision logged
- task proposed
- anomaly flagged
- approval requested
- document updated

### Explainability Layer

The product should explain:
- why a task was created
- why an anomaly was flagged
- why an owner was suggested
- what source created a decision log

This prevents the system from feeling like a black box.

### Drift Detection

Authrix should detect organizational drift, not just static events.

Examples:
- code changed but docs were not updated
- decisions were recorded but follow-up work has no owner
- tasks were assigned but have gone stale
- costs increased without corresponding product activity
- the same unresolved topic keeps returning across meetings

This is one of the highest-value long-term product capabilities.

## Meeting and Audio Handling

Meeting intelligence is important, but it does not need to be modeled as a standalone agent.

The cleaner design is:
- user uploads meeting audio
- transcription is generated
- structured extraction identifies decisions, owners, deadlines, action items, and unresolved questions
- Docs Agent turns that into durable knowledge
- Workflow Agent turns relevant outputs into follow-through

Speech-to-text is a tooling pipeline, not an agent identity.

## Technical Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui where helpful

The frontend should feel professional, trustworthy, and operationally clear.

### Backend

- Node.js product backend layer
- Next.js route handlers or API endpoints
- product-level routing logic
- approval and audit handling
- integration adapters
- data normalization pipelines
- runtime boundary interface

### Runtime

- Authrix-owned autonomous runtime layer
- built by adapting proven OpenClaw infrastructure under MIT
- kept behind Authrix product boundaries
- treated as an internal implementation detail rather than a user-facing dependency

### Database and Persistence

- filesystem-backed persistence today
- Supabase or Postgres as the product matures

The durable store should hold the product's structured state, not just raw blobs.

### Security and Identity

- Auth0 for AI Agents
- Token Vault for delegated third-party access
- approval-gated backend-mediated writes

## Technical Principles

Authrix should follow these technical principles:
- agents accept typed normalized input
- agents return structured typed output
- agent logic stays small and testable
- external actions route through controlled backend adapters
- reads and writes stay clearly separated
- output-based chaining is preferred over shared raw context
- auditability is preserved everywhere it matters
- the product layer stays readable even when runtime internals evolve

## UX Philosophy

Authrix should feel:
- autonomous, but not hidden
- intelligent, but not vague
- powerful, but not risky
- polished, but not bloated

The interface should help users answer:
- what happened
- why it matters
- what should happen next
- what needs approval
- what changed over time

That combination is what makes the product feel like a real operations layer instead of a collection of AI demos.

## Development Model

Authrix should be developed with a proper branching workflow because the product has multiple layers, integrations, and moving parts.

Core workflow:
- `main` remains stable and review-ready
- `dev` acts as the shared integration branch
- all meaningful work happens in feature branches
- pull requests are required for merges into shared branches

Branching is not about rigid ownership between collaborators. It is about keeping changes isolated, understandable, and safe.

## Open-Source Lineage

Authrix is a separate product.

Its runtime layer is being accelerated by adapting proven OpenClaw infrastructure under the MIT license. That credit should be preserved in repository and legal materials. Product-facing materials, however, should describe the system as Authrix: a secure autonomous operations platform for startup teams.

## Vision

Long term, Authrix gives small startup teams something they usually do not have:

a persistent operational intelligence layer

Instead of manually checking code activity, cleaning up docs, translating meetings into tasks, noticing cost drift too late, and trying to remember decisions from scattered notes, the team gets a product that helps keep the organization synchronized.

The strongest initial wedge is clear:

help small technical teams stay aligned across engineering, meetings, documentation, ownership, and operational awareness.
