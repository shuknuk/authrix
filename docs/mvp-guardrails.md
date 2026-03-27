# MVP Guardrails

This document defines what NOT to build for the Authrix MVP, and why.

These guardrails exist to prevent overengineering and keep the project focused on a strong, demo-ready core.

---

## Core Principle

Win with:
- clarity
- execution
- demo quality

Not with:
- feature count
- complexity
- number of integrations

---

## 🚫 Do NOT build: Real-time sync

### What it means
- live updating UI without refresh
- WebSockets or subscriptions
- streaming updates from APIs

### Example
A GitHub commit triggers an instant dashboard update.

### Why we are not building this

**Practical**
- adds significant complexity (state sync, race conditions)
- requires extra infra (websockets, subscriptions)

**Product**
- does not improve the demo meaningfully

### What to do instead
- fetch data on page load
- optionally add a manual “Refresh” button

---

## 🚫 Do NOT build: Complex multi-agent orchestration

### What it means
- agents dynamically calling other agents
- planning loops and recursive execution
- orchestration frameworks (LangGraph-style)

### Example
A parent agent spawns sub-agents, tracks execution state, retries tasks, and dynamically routes decisions.

### Why we are not building this

**Practical**
- difficult to debug
- increases failure points
- high implementation cost

**Product**
- not required to demonstrate the concept

### What to do instead

Use a simple pipeline:

```ts
const summary = engineerAgent(data)
const tasks = taskAgent(summary)
const cost = devopsAgent(data)