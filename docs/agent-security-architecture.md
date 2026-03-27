# Agent Security Architecture

This document defines how Authrix handles multi-agent execution securely.

It describes:
- agent roles
- data flow
- permission boundaries
- execution model

---

## 🧠 Core Idea

Authrix is a multi-agent system where:

- each agent has a **strictly limited scope**
- each agent only sees **minimal required data**
- no agent has **direct access to secrets or full system context**

---

## 🦀 Agent Model

Authrix uses a **parent-child agent model**.

### Parent Agent (Orchestrator)

Responsibilities:
- receives user request
- decides which agents to call
- sequences execution
- combines outputs
- triggers approval flow

The parent agent does NOT:
- directly access external APIs
- expose sensitive data unnecessarily

---

### Child Agents

Each agent has a narrow role.

#### Engineer Agent
- input: GitHub activity
- output: structured weekly summary

#### Task Agent
- input: summary
- output: list of tasks

#### DevOps Agent
- input: usage data
- output: cost + risk insights

---

## 🔐 Security Model

### 1. No Direct Secret Access

Agents do NOT:
- store API keys
- directly call external APIs with credentials

Instead:
- agents request actions
- backend executes securely

---

### 2. Mediated Execution Layer

Flow:

1. agent decides it needs an action
2. request goes to backend
3. backend:
   - verifies permissions
   - retrieves tokens (Auth0)
   - executes API call
4. backend returns sanitized result

Agents only receive:
- results
- never raw credentials

---

### 3. Data Minimization

Agents only receive:
- the exact data required for their task

Example:
- Task Agent receives summary
- NOT raw GitHub activity

---

### 4. Output-Based Chaining

Agents communicate via outputs only.

Instead of:
- sharing full state

They pass:
- processed, structured outputs

Example:

```ts
const summary = engineerAgent(data)
const tasks = taskAgent(summary)
```
