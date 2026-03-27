# Authrix Context

Authrix is a hackathon MVP focused on building secure, permissioned AI agents that operate on real data.

## Core Goal

Demonstrate that AI agents can:
- understand real system activity
- generate meaningful actions
- execute only with explicit user approval

This is NOT a general AI assistant. It is an operations system.

---

## Core System Design

Authrix follows a parent-child agent model:

- Parent agent:
  - orchestrates flow
  - decides which agents to use
  - presents results to the user

- Child agents:
  - Engineer Agent → summarizes GitHub activity
  - Task Agent → generates actionable tasks
  - DevOps Agent → tracks API usage and cost risk

Each agent has a narrow responsibility and limited scope.

---


## Security Architecture

Authrix enforces strict agent boundaries:

- agents never store or access raw API credentials
- all external actions are mediated through a backend layer
- each agent receives only minimal required inputs
- agents communicate through structured outputs, not shared state
- sensitive data is never passed unnecessarily between agents

This ensures safe execution in real-world environments.

---

## Key Principles

- No "god agent"
- Clear separation of responsibilities
- Actions must be approval-gated
- Security and permissions are central to the system
- Keep outputs structured and deterministic where possible

---

## MVP Scope (Strict)

Focus ONLY on:

1. GitHub activity ingestion (mock or real)
2. Weekly engineering summary
3. Task generation from that summary
4. API spend / risk visualization (mocked if needed)
5. Approval flow before actions

Do NOT build:
- voice input
- real-time sync
- complex multi-agent orchestration frameworks
- multiple external integrations

---

## Future Ideas (Do Not Build Now)

These come from initial brainstorming and are NOT part of the MVP:

- Slack integration
- Notion or docs syncing
- voice recordings
- real-time collaboration features
- deeper workflow automation systems

---

## Product Philosophy

Authrix is about:
- turning insight into action
- but doing so safely and transparently

The user must always understand:
- what the agent is doing
- why it is doing it
- what permissions it is using

---

## Demo Focus

The demo should clearly show:

1. input (GitHub activity)
2. transformation (summary + tasks + cost insight)
3. decision point (approval modal)
4. controlled execution

Clarity > complexity