# Authrix

Authrix is a secure autonomous operations layer for startup teams.

It is designed for small technical teams that move quickly across product, engineering, meetings, documentation, infrastructure, and execution, but struggle to preserve continuity across all of that motion. Authrix exists to turn scattered activity into structured organizational action.

This is not a generic chatbot, a narrow automation script, or a dashboard pretending to be an agent system. Authrix is a product layer built on top of an autonomous runtime, with clear security boundaries, persistent context, specialized agents, and human oversight.

## One-Line Pitch

Authrix is a secure autonomous operations layer that turns engineering activity, meetings, documentation, workflow signals, and operational data into structured, auditable action for startup teams.

## Overview

Most startup teams already have tools for communication, engineering, storage, and deployment. The problem is not lack of tools. The problem is lack of continuity.

Important context gets created every day:
- code gets merged
- meetings happen
- decisions get made
- tasks get mentioned
- infrastructure changes
- costs move
- documentation drifts

But those signals rarely become shared organizational memory or reliable follow-through. The result is a familiar startup pattern:
- people re-ask questions the team already answered
- nobody can quickly summarize what changed this week
- action items remain implied instead of assigned
- docs become stale
- operational risk rises quietly
- founders manually stitch together information from too many places

Authrix is meant to solve that. It acts as the connective intelligence layer above the team's existing systems and turns raw activity into summaries, decisions, tasks, approvals, alerts, and durable records.

## Core Thesis

Startups already generate the right information. They just do a poor job turning it into reliable operational action.

Authrix fixes that by doing three things well:
- observing relevant activity across the workspace
- extracting the signals that matter
- turning those signals into structured, reviewable outputs

The goal is not to automate everything blindly. The goal is to create a product that helps small teams stay aligned, accountable, and operationally aware without losing control.

## Product Positioning

Authrix is not:
- a general AI assistant
- a task manager replacement
- a note-taking app with AI attached
- an email bot
- a static dashboard
- fake "agent complexity" designed for show

Authrix is:
- a startup operations system
- a multi-agent product with specialized roles
- a live control tower with approvals and auditability
- a secure delegated-action layer over real tools
- a shared memory and accountability system for a startup team

## Main Use Cases

Authrix should be able to help answer questions like:
- "Summarize this week's engineering progress."
- "What changed after the auth migration?"
- "Turn this meeting recording into notes and action items."
- "What decisions were made in that meeting?"
- "What follow-ups are still unowned?"
- "Why did our costs spike this week?"
- "Update the docs from today's sync."

These are not random prompts. They are operational questions that show up repeatedly in real teams.

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

Authrix is not only prompt-driven. It is also designed to react to uploaded files, system activity, and recurring operational signals.

### 2. Autonomous Runtime Layer

Authrix is designed to build on OpenClaw as the runtime foundation.

OpenClaw should provide:
- persistent execution
- background job handling
- message-driven sessions
- multi-step task handling
- tool use
- runtime-level autonomy

The point of using OpenClaw is not to outsource the product. It is to avoid rebuilding the generic runtime infrastructure that already exists.

OpenClaw should own runtime behavior.
Authrix should own product behavior.

### 3. Product Backend Layer

This is the real application layer of Authrix.

It should own:
- workspace and team state
- structured records
- agent routing
- approval policies
- audit history
- risk classification
- job tracking
- decision logging
- workflow records
- anomaly records
- integration adapters
- shared state for the control tower

This is where Authrix becomes a real product instead of a wrapper around agents.

### 4. Security and Identity Layer

Security is one of the strongest and most important parts of Authrix.

Authrix is designed to use Auth0 for AI Agents and Token Vault as the delegated identity and token custody layer. That makes it possible to connect systems like GitHub, Notion, Vercel, Supabase, and chat platforms without letting agents directly hold raw credentials.

This matters because Authrix is fundamentally about trusted delegated action.

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

The product should balance two modes:
- natural interaction through prompts and requests
- clear oversight through the control tower

The system should feel autonomous, but never invisible.

## What Authrix Should Own

The cleanest technical boundary in the whole project is the line between OpenClaw and Authrix.

OpenClaw should own:
- long-running execution
- session lifecycle
- background processing
- tool execution plumbing
- generic autonomous runtime behavior
- runtime-level task handling

Authrix should own:
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
- if a capability would exist in any autonomous system, it belongs to the runtime
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

## Technical Architecture

The technical architecture should stay simple, typed, and reviewable.

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui where helpful

The frontend should focus on clarity, professionalism, and trust. The control tower should feel modern and intentional, not overloaded.

### Backend

- Node.js product backend layer
- Next.js route handlers or API endpoints
- product-level routing logic
- approval and audit handling
- integration adapters
- data normalization pipelines

### Database

- Supabase or Postgres

The database should hold the product's structured state, not just raw blobs.

### Security and Identity

- Auth0 for AI Agents
- Token Vault

All delegated third-party access should route through this layer.

### Runtime

- OpenClaw as the autonomous runtime foundation

### Future Hardened Deployment Option

- NemoClaw or OpenShell can be treated as later-stage deployment hardening, not the initial target

## Technical Principles

Authrix should follow these technical principles:
- agents accept typed normalized input
- agents return structured typed output
- agent logic should stay small and testable
- avoid unnecessary orchestration frameworks
- route external actions through controlled backend adapters
- keep reads and writes clearly separated
- prefer output-based chaining over shared raw context
- preserve auditability everywhere it matters

## UX Philosophy

Authrix should feel:
- autonomous, but not hidden
- intelligent, but not vague
- powerful, but not risky
- polished, but not overbuilt

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

## Why This Product Matters

Most tools solve one narrow slice of startup work:
- code
- docs
- tickets
- meetings
- infra monitoring

Authrix is interesting because it tries to connect those slices into one operational layer with shared context, approvals, accountability, and memory.

That is the real value:
- less context loss
- better follow-through
- better visibility
- better trust around autonomous action
- more leverage for small teams

## Vision

Long term, Authrix gives small startup teams something they usually do not have:

a persistent operational intelligence layer

Instead of manually checking code activity, cleaning up docs, translating meetings into tasks, noticing cost drift too late, and trying to remember decisions from scattered notes, the team gets a product that helps keep the organization synchronized.

The strongest initial wedge is clear:

help small technical teams stay aligned across engineering, meetings, documentation, ownership, and operational awareness.
