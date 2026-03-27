# Architecture Overview

This document describes the high-level architecture of Authrix.

The system is designed to be simple, modular, and demo-friendly.

---

## Core Idea

Authrix is a secure, multi-agent system that transforms system activity into actionable insights.

The system follows a parent-child agent model with strict boundaries.

---

## System Components

### 1. Frontend

Built with Next.js.

Main responsibilities:
- dashboard UI
- navigation
- reusable cards
- approval modal
- loading, empty, and error states

Primary pages:
- Dashboard
- Connections
- Activity
- Tasks
- Costs

Reusable dashboard sections:
- Weekly Summary card
- Suggested Tasks card
- API Spend / Risk card
- Approval Queue card

---

### 2. Backend

Implemented with lightweight Next.js route handlers.

Main responsibilities:
- serve normalized activity data
- connect frontend requests to agent logic
- handle controlled execution requests
- mediate access to integrations and secrets

Example routes:
- `/api/github`
- `/api/summarize`
- `/api/tasks`
- `/api/costs`

---

### 3. Agents

Located in `lib/agents/`.

Agents are simple, focused functions. They do not directly own secrets or unrestricted tool access.

#### Engineer Agent
- input: GitHub activity
- output: structured weekly engineering summary

#### Task Agent
- input: summary output from Engineer Agent
- output: suggested actionable tasks

#### DevOps Agent
- input: usage or cost-related data
- output: cost and risk insights

#### Orchestrator
- coordinates flow between agents
- combines outputs
- prepares data for the UI
- triggers approval flow before write actions

---

## Data Flow

1. GitHub activity is fetched or mocked
2. raw activity is normalized
3. Engineer Agent generates summary
4. Task Agent generates tasks from the summary
5. DevOps Agent generates cost or risk insights
6. Orchestrator combines outputs
7. frontend renders cards
8. user attempts an action
9. approval modal appears before execution

---

## Security Architecture

Authrix is built around strict agent boundaries.

Rules:
- agents do not store API keys
- agents do not directly call external APIs with credentials
- all external actions go through a mediated backend layer
- each agent only receives the minimal data it needs
- outputs are passed between agents instead of raw context
- write actions require explicit approval

This reduces sensitive data exposure and limits the blast radius of any individual agent.

---

## Design Principles

- no god agent
- strict separation of concerns
- minimal data exposure
- controlled execution
- structured typed outputs
- simple orchestration over complex frameworks

Example:

```ts
const summary = engineerAgent(activity)
const tasks = taskAgent(summary)
const cost = devopsAgent(usageData)