# Agent Security Architecture

This document defines how Authrix handles autonomous execution securely.

It covers:
- agent boundaries
- backend mediation
- Auth0 and Token Vault
- approval-gated writes
- sandboxing and guardrails
- deployment trust assumptions

## Core Security Position

Authrix is an always-on autonomous product. That means security cannot stop at OAuth or UI permissions.

Authrix must protect three different surfaces:
- external systems such as GitHub and Notion
- the Authrix product backend and runtime
- the host machine where Authrix runs

Auth0 is a critical part of the trust model, but it is not the entire trust model. Auth0 protects delegated identity and token custody. Sandbox boundaries, least privilege, approval rules, and host isolation protect everything else.

## Deployment Trust Model

Preferred deployment model:
- Authrix runs on a dedicated worker machine, mini PC, VM, or VPS
- that machine is used for Authrix, not as a normal personal device
- connected accounts should be limited-scope operational accounts where possible

Authrix should not assume that a founder's personal laptop is the primary trusted deployment target.

Why:
- personal machines often contain browser sessions, password managers, SSH keys, local documents, and unrelated private data
- an always-on autonomous runtime increases the blast radius of local mistakes if it shares a host with personal data
- a dedicated worker box matches the product vision better and creates a cleaner trust boundary

## Agent Coordination Model

Authrix uses specialized peer agents coordinated by backend logic and shared product state.

There is no privileged parent orchestrator agent with broad access.

Backend responsibilities:
- choose which agent runs
- provide normalized typed input
- enforce policy and approvals
- fetch delegated credentials when needed
- persist outputs into product records
- audit what happened

Agent responsibilities:
- process scoped input
- return structured output
- propose actions when needed
- avoid hidden side effects

## Security Principles

### 1. No Raw Secret Ownership in Agents

Agents must not:
- store OAuth tokens
- read raw API keys from environment directly
- call third-party APIs with credentials on their own

Instead:
- the backend mediates all credentialed access
- Auth0 Token Vault handles delegated token custody where supported
- agents receive only the data required to do their job

### 2. Data Minimization

Agents should receive the smallest useful input.

Examples:
- Engineering Agent receives normalized engineering activity, not full repo secrets or unrelated workspace state
- Workflow Agent receives structured notes and decisions, not raw integration payloads unless necessary
- DevOps Agent receives summarized usage inputs, not arbitrary credentialed dashboard access

### 3. Output-Based Chaining

Agents should coordinate through structured outputs instead of broad shared context.

Example:

```ts
const engineeringSummary = await engineerAgent(engineeringActivity)
const docsOutput = await docsAgent({
  engineeringSummary,
  sourceDocuments,
})
const workflowOutput = await workflowAgent({
  decisions: docsOutput.decisions,
  tasks: docsOutput.suggestedTasks,
})
```

This keeps trust boundaries legible and reduces accidental data exposure.

### 4. All Writes Are Backend-Mediated

Agents do not perform external writes directly.

Write path:
1. agent proposes a structured action
2. backend classifies the risk
3. approval is requested if policy requires it
4. backend executes the write through a controlled adapter
5. execution result is recorded in audit history

### 5. Honest Fallbacks

Authrix must not claim secure or autonomous behavior that is not actually implemented.

If a flow is local-only, mocked, or fallback-based:
- it should be represented honestly in code and product state
- it should not masquerade as a hardened live path

## Auth0 and Token Vault

Auth0 is the identity and delegated-access layer for Authrix.

Auth0 responsibilities:
- user login and session identity
- OAuth consent handling
- delegated token custody through Token Vault
- connected-account access for systems such as GitHub
- refresh and lifecycle management for delegated access

Auth0 does not replace:
- host sandboxing
- approval policy
- runtime isolation
- backend audit rules

Authrix responsibilities around Auth0:
- keep Auth0 integration isolated and reviewable
- never pass raw delegated tokens through agent logic
- request only the scopes needed for each integration
- route all third-party writes through backend adapters

## Execution Tiers

Authrix should treat actions and tools by execution tier.

### Tier 1: Read-Only Intelligence

Examples:
- summarization
- anomaly detection
- note extraction
- timeline generation

Policy:
- can run without approval
- should still be audited when it materially affects product records

### Tier 2: Product-State Writes

Examples:
- storing generated records
- persisting task updates
- recording decision artifacts

Policy:
- allowed through backend product services
- must be typed, validated, and auditable

### Tier 3: External Workspace Writes

Examples:
- create GitHub issue
- publish docs to Notion
- update shared records in external systems

Policy:
- must route through approval-aware backend adapters
- should use delegated access from Auth0 where applicable
- must record outcome and provenance

### Tier 4: Host-Level Execution

Examples:
- filesystem writes outside approved product paths
- shell commands
- runtime tool execution with host consequences
- network calls outside approved adapters

Policy:
- highest risk tier
- should be sandboxed by default
- should require explicit allowlists and strong approval semantics
- should be minimized in normal product operation

## Sandbox Hardening Requirements

Before Authrix is treated as a real deployable autonomous worker, sandbox hardening should be part of the product requirements.

Required hardening directions:
- default-deny host execution where feasible
- explicit tool allowlists
- path-scoped filesystem access
- restricted outbound network targets where feasible
- separation between product data paths and arbitrary host paths
- no implicit access to personal browser sessions or unrelated local apps
- clear distinction between runtime execution inside guardrails and privileged backend adapters

Preferred operating posture:
- read-only analysis runs freely within scoped product boundaries
- external writes go through backend adapters plus approvals
- host-level execution stays narrow, observable, and policy-limited

## Approval Model

Approval is not just a UI feature. It is part of the execution boundary.

Each proposed action should include:
- action kind
- source record references
- explanation
- target system
- risk tier
- approval state
- execution outcome

Policy examples:
- low risk: summaries, derived records, passive anomaly detection
- medium risk: shared drafts, proposed follow-up creation, non-sensitive workspace updates
- high risk: sensitive external writes, host-level operations, wide-impact automation

## Audit and Explainability

Every meaningful automated action should be reconstructable.

Audit expectations:
- who initiated the run
- which agent produced the output
- which records were used as input
- what action was proposed
- why approval was requested or skipped
- what external system was touched
- what happened during execution

Explainability expectations:
- why was this task created
- why was this anomaly flagged
- why was this owner suggested
- why was this write proposed

## Practical Host Guidance

Recommended worker-box setup for real testing:
- separate machine, VM, or VPS
- dedicated OS user for Authrix
- no personal browser profile or password manager
- limited-scope connected accounts where possible
- encrypted disk and normal OS security hygiene
- product data stored in a dedicated application path

This is not because Authrix is assumed to be unsafe forever. It is because good autonomous-system security treats host separation as a first-class guardrail.

## Security Milestone Before Phase 6

Before broadening product behavior further, Authrix should treat the following as explicit next-step security work:
- sandbox posture and execution tiers documented in the product roadmap
- dedicated worker-box deployment model documented as the preferred trust boundary
- host-level tool access narrowed and reviewed
- all external writes confirmed to pass through approval-aware backend adapters
- Auth0 and Token Vault kept as the delegated-access layer, not the only security layer

That is the security baseline for turning Authrix from a strong prototype into a responsibly deployable autonomous system.
