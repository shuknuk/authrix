# AGENTS.md

## Project overview
This repository is a hackathon MVP for a secure startup operations dashboard powered by specialized AI agents.

The product goal:
- authenticate users with Auth0
- connect GitHub as the first external integration
- ingest recent engineering activity
- generate a weekly engineering summary
- generate suggested follow-up tasks from that summary
- show an API spend / risk card
- require explicit approval before any write action
- keep the experience clean, modern, and demo-ready

This is an MVP for a hackathon. Prioritize speed, clarity, and reliability over completeness.

---

## Tech stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Auth0
- Supabase for simple persistence if needed
- Mock data first, then replace with real integrations

---

## Product boundaries
Do:
- build only the MVP needed for a strong demo
- keep architecture simple and readable
- use mock data first when real integrations are not yet wired
- preserve a clean dashboard UX
- keep all agent outputs typed and structured
- gate any write actions behind approval UI

Do not:
- add voice features
- add real-time streaming unless explicitly requested
- add extra integrations beyond GitHub unless explicitly requested
- add unnecessary libraries
- introduce complex agent orchestration frameworks
- silently change architecture without explaining it

---

## Core user flow
The primary demo flow is:

1. user logs in with Auth0
2. user lands on dashboard
3. GitHub activity is fetched or mocked
4. engineering activity is normalized
5. engineer agent generates a weekly summary
6. task agent generates suggested tasks
7. devops agent generates a cost / risk card
8. user sees results in the dashboard
9. user attempts a write action
10. approval modal appears before proceeding

Everything in this repo should support this flow first.

---

## Pages
The MVP should include these pages:

- Dashboard
- Connections
- Activity
- Tasks
- Costs

---

## Dashboard sections
The dashboard should include these reusable sections:

- Weekly Summary card
- Suggested Tasks card
- API Spend / Risk card
- Approval Queue card

---

## Repo structure
Prefer this structure unless there is a compelling reason to adjust it:

- `app/` for pages and route handlers
- `components/` for reusable UI
- `lib/agents/` for agent logic
- `lib/github/` for GitHub ingestion and normalization
- `lib/auth/` for Auth0 helpers
- `lib/mock/` for mock data
- `types/` for shared types

---

## Agent design rules
Keep agent logic simple.

Expected initial agents:
- `engineerAgent`
- `taskAgent`
- `devopsAgent`

Optional lightweight helper:
- `docsAgent`

Each agent should:
- accept normalized typed input
- return structured typed output
- avoid side effects where possible
- avoid network calls unless explicitly needed
- be testable with mock data

Do not build a heavy autonomous orchestration framework. Keep agents as clear functions and small modules.

---

## Engineering rules
- Prefer functions over classes
- Prefer small route handlers
- Keep types explicit
- Reuse components before creating new ones
- Keep UI modern, minimal, and clean
- Add loading, empty, and error states where relevant
- Avoid unnecessary abstractions
- Do not add dependencies unless they provide strong value

---

## Auth and security rules
This project is about secure delegated action.

Rules:
- do not fake security guarantees in comments or UI copy
- write actions must be approval-gated
- Auth0-related code should be isolated and easy to review
- if a flow is mocked, label it clearly in code comments
- do not silently simulate final secure behavior if it is not implemented yet

---

## Branching strategy
This repo should use a branch-based workflow.

Main branches:
- `main` is stable and demo-safe only
- `dev` is the shared integration branch

Feature branches to create:
- `feat/app-shell-dashboard`
- `feat/github-summary-pipeline`
- `feat/task-approval-flow`
- `feat/auth0-connections`
- `feat/cost-risk-card`

Rules:
- work should be developed on the relevant feature branch
- merge feature branches into `dev` first
- only merge into `main` when the work is stable and reviewed
- do not directly commit large feature work to `main`
- before merging, summarize what changed and any risks

If asked to perform large changes, choose or create the most appropriate feature branch first.

---

## Development workflow
When starting work:
1. inspect the current repo
2. initialize the app if needed
3. create the required branches
4. scaffold the MVP
5. build features on the appropriate feature branches
6. integrate into `dev`
7. only merge stable work into `main`

Before major edits:
- explain the plan briefly

After major edits:
- summarize changed files
- summarize what was built
- mention follow-up work or known gaps

---

## Definition of done
Work is considered complete only if:
- the app builds without obvious type issues
- changed pages render
- changed components have sensible states
- imports are clean
- no major unrelated file churn exists
- the feature matches the intended MVP and demo flow

---

## Important priority
This is a hackathon project.

Optimize for:
- one strong demo flow
- clean visuals
- believable architecture
- speed of iteration
- easy review

Do not optimize for:
- maximum feature count
- theoretical extensibility
- overengineering