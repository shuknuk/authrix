# Authrix

Hackathon MVP for a secure startup operations dashboard powered by specialized AI agents.

## Core flow
- Auth0 login
- GitHub connection
- engineering summary
- task suggestions
- API spend / risk visibility
- approval-gated actions

## Security Model

Authrix enforces strict boundaries between agents.

- agents do not hold API keys
- all external actions are mediated through a secure backend
- each agent only receives minimal required data
- outputs are passed between agents instead of raw context
- all write actions require explicit user approval

Auth0 is the delegated identity layer, not the entire security model. Authrix also relies on:
- backend-mediated execution
- approval gating for writes
- dedicated worker-box deployment as the preferred trust boundary
- sandbox and host guardrails for autonomous runtime behavior

See `/docs/agent-security-architecture.md` for details.

## Guardrails and Deployment

Authrix is being designed for a dedicated worker machine, VM, or VPS instead of a normal personal laptop.

Why:
- always-on autonomous products should minimize host-machine blast radius
- personal devices usually contain browser sessions, password managers, SSH keys, and unrelated private data
- Auth0 secures delegated access to external systems, but it does not secure the entire host by itself

Baseline guardrails already present in the codebase:
- external writes can be disabled by policy
- manual token fallbacks are now explicit instead of assumed
- local generated docs and persisted state stay inside `.authrix-data`
- approval execution rejects already-resolved requests
- control-tower security posture is visible through `/api/security/status` and the Connections page
- policy-blocked runtime and approval events are persisted and visible through `/api/security/events`
- deployment bring-up readiness is visible through `/api/deployment/readiness`
- deployment smoke-test results are visible through `/api/deployment/smoke-test`

The deeper sandbox hardening phase will build on top of these guardrails instead of replacing them later.

## Worker-Box Bring-Up

Authrix now includes a Phase 7 bring-up layer for dedicated worker machines.

What is included:
- deployment readiness checks in the Connections page
- deployment smoke-test results in the control tower
- `npm run check:worker-box` for local worker-box config validation
- `npm run smoke:worker-box` for first-pass deployment smoke checks
- a dedicated runbook at [docs/worker-box-runbook.md](docs/worker-box-runbook.md)

Recommended first bring-up flow:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run check:worker-box
npm.cmd run start
npm.cmd run smoke:worker-box
```

## Local Auth0 Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your Auth0 tenant values.
3. Generate `AUTH0_SECRET` with a 32-byte hex string.
4. In the Auth0 dashboard, configure:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
   - Application Login URI: leave blank for local `http://localhost` development unless you have an HTTPS login URL

Authrix uses a `Regular Web App` in Auth0 and keeps delegated third-party access on the backend.

To use GitHub through Auth0 Connected Accounts / Token Vault, make sure your Auth0 tenant is set up with:
- Token Vault enabled
- My Account API enabled
- Refresh Tokens and MRRT enabled for the application
- a GitHub connected account configured for Token Vault
- Offline Access enabled in the GitHub connection permissions

## Local GitHub Setup

Authrix now supports a real GitHub ingestion path with clean fallbacks.

1. Add `GITHUB_OWNER` and `GITHUB_REPO` to `.env.local` to point at the repo you want to ingest.
2. Optional: add `GITHUB_PERSONAL_ACCESS_TOKEN` for higher rate limits or private repos.
3. Set `AUTH0_GITHUB_CONNECTION_NAME` to your Auth0 GitHub connection name.
4. Optional: set `AUTH0_GITHUB_CONNECTION_SCOPES` if you want scopes other than `repo,read:org`.
5. Optional: add `AUTH0_TOKEN_VAULT_GITHUB_ACCESS_TOKEN` only if you need a local override during development.
6. Optional: set `AUTHRIX_ALLOW_PERSONAL_ACCESS_TOKEN_FALLBACK=true` if you want Authrix to use `GITHUB_PERSONAL_ACCESS_TOKEN` as a development fallback.
7. Optional: set `AUTHRIX_ALLOW_TOKEN_VAULT_GITHUB_ACCESS_TOKEN_OVERRIDE=true` if you want the manual Token Vault override env to be usable.

If no live GitHub configuration is present, Authrix stays in mock mode and labels that clearly in the Connections page. When Auth0 is configured, the Connections page exposes a `Connect GitHub With Auth0` action that uses the SDK's built-in `/auth/connect` flow.

## Slack Messaging Setup

Phase 10 introduces Slack as Authrix's first professional messaging surface.

Add these values to `.env.local` when you are ready to connect Slack:
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_WORKSPACE_ID`
- `SLACK_BOT_USER_ID`
- `SLACK_DEFAULT_CHANNEL_ID` for proactive briefings

Current route:
- `POST /api/slack/events`
- `GET/POST /api/slack/briefings`

What the current messaging layer does:
- verifies inbound Slack requests with the signing secret
- handles Slack URL verification
- records routed conversations and messages in `.authrix-data/slack-state.json`
- routes each message to an internal Authrix specialist through deterministic or model-backed routing
- records the dispatch in the control tower timeline and agent-run history
- records lightweight delegation chains when a request spans multiple specialists
- captures chat-native follow-up tasks before they drift into side conversations
- persists scheduled briefing definitions and generated Slack briefing history
- exposes authenticated Slack state through `GET /api/slack/state`
- surfaces Slack onboarding, routed conversations, delegation history, briefings, and recent message history in the control tower

What it does not do yet:
- full Slack OAuth installation flow
- rich Slack commands
- threaded agent-specific command syntax
- full autonomous scheduling beyond the current persisted briefing/job path

## Ollama Cloud and Model Routing

Phase 11 introduces the first real hosted model layer for Authrix.

Add these values to `.env.local` when you are ready to connect Ollama Cloud:
- `AUTHRIX_MODEL_PROVIDER=ollama-cloud`
- `OLLAMA_API_KEY`
- optional: `OLLAMA_BASE_URL` (defaults to `https://ollama.com/api`)

Per-agent model defaults now live in environment-backed registry settings:
- `AUTHRIX_MODEL_ENGINEER`
- `AUTHRIX_MODEL_DOCS`
- `AUTHRIX_MODEL_WORKFLOW`
- `AUTHRIX_MODEL_DEVOPS`
- `AUTHRIX_MODEL_ROUTER`

Routing mode:
- `AUTHRIX_ROUTER_EXECUTION=local`
  Always use deterministic keyword routing.
- `AUTHRIX_ROUTER_EXECUTION=auto`
  Try model-based routing when the provider is configured, otherwise fall back honestly.
- `AUTHRIX_ROUTER_EXECUTION=model`
  Prefer model-based routing and still fall back if the provider call fails.

What the current Phase 11 slice does:
- adds a clean provider adapter boundary for hosted model calls
- adds an Ollama Cloud chat adapter
- centralizes per-agent default models in one registry
- wires model defaults into runtime session creation for Engineer, Docs, Workflow, and Task flows
- lets Engineer, Docs, Workflow, and DevOps prefer hosted-model execution in `auto` or `model` mode
- upgrades Slack request routing to use model classification when configured
- exposes model-layer posture in the control tower

What it does not do yet:
- add full prompt/version management for each agent
- add exact token and dollar metering dashboards for model spend
- add deep autonomous sub-agent execution chains beyond the current lightweight delegation layer

Execution modes now support:
- `AUTHRIX_ENGINEER_EXECUTION=auto|local|model|runtime`
- `AUTHRIX_DOCS_EXECUTION=auto|local|model|runtime`
- `AUTHRIX_WORKFLOW_EXECUTION=auto|local|model|runtime`

In `auto` mode, Authrix will:
- prefer the live runtime when available
- otherwise use the hosted model layer when configured
- otherwise fall back honestly to the local typed pipeline

## Runtime Foundation

Authrix owns the product and runtime identity.

The runtime layer in this repo is being built by adapting proven OpenClaw infrastructure under the MIT license. That lineage should be credited in repository materials, but it is not a product-facing dependency. Authrix is the product.

By default, the app uses the local mock runtime path so the dashboard stays deterministic when live runtime behavior is unavailable. For runtime-backed execution during development:

1. Set `AUTHRIX_RUNTIME=openclaw`.
2. Set `AUTHRIX_DEPLOYMENT_MODE=worker-box` when you are preparing a dedicated worker deployment.
3. Configure `OPENCLAW_GATEWAY_URL`.
4. Add `OPENCLAW_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_PASSWORD` if your runtime transport requires credentials.
5. Optional: set `OPENCLAW_AGENT_ID` if you want all Authrix runtime calls to target one configured runtime worker.
6. Optional: adjust `AUTHRIX_RUNTIME_CONNECT_SCOPES` if the runtime transport should negotiate a narrower scope set.

## External Write Policy

Mediated write execution now has an explicit policy switch.

- `AUTHRIX_ALLOW_EXTERNAL_WRITES=true`
  Allows approved external writes such as GitHub issue creation or Notion publishing.

- unset or `false`
  Blocks those external writes and returns a policy message instead.

By default, production-style environments should set this explicitly on a dedicated worker deployment. Local development should keep this blocked unless you are intentionally testing a mediated write flow.

## Runtime Tool Policy

Phase 6 now includes baseline runtime tool guardrails.

- `AUTHRIX_RUNTIME_ALLOWED_TOOLS`
  Optional comma-separated allowlist for named runtime tools.

- `AUTHRIX_RUNTIME_BLOCKED_TOOLS`
  Optional comma-separated hard blocklist for named runtime tools.

- `AUTHRIX_RUNTIME_ALLOW_HOST_TOOLS`
  Defaults to `false`. Host-level tools stay blocked by default unless explicitly enabled.

Blocked runtime tool requests are recorded as security events so operators can inspect policy enforcement from the control tower.

Recommended default posture:
- keep `AUTHRIX_RUNTIME_ALLOW_HOST_TOOLS=false`
- only set `AUTHRIX_RUNTIME_ALLOWED_TOOLS` for the narrow tool surface Authrix really needs
- use `AUTHRIX_RUNTIME_BLOCKED_TOOLS` as a hard deny list for anything you never want available on the worker box

Engineering note: some internal runtime modules still use gateway-shaped transport and configuration naming while the reused runtime foundation is being folded more deeply into Authrix. That is an implementation detail, not the product architecture.

The Connections page shows whether Authrix is using local mock execution, a live runtime-backed path, or a disconnected runtime configuration.

Important note: Authrix now has real persisted product infrastructure, a live GitHub path, approval-backed writes, and runtime-backed execution for selected pipelines. Some flows still fall back honestly to deterministic local execution when runtime output is unavailable or not yet tuned for structured results.

## Persistent Product State

Authrix now persists the shared workspace snapshot to `.authrix-data/workspace-state.json`.

That means:
- dashboard, activity, tasks, and approvals all read from persisted product state
- refreshes rebuild the snapshot and write it back to disk
- approval changes update the persisted snapshot instead of mutating an in-memory-only object

## Engineering Pipeline Mode

The weekly engineering summary can now run in three modes:

- `AUTHRIX_ENGINEER_EXECUTION=auto`
  Authrix will use the live runtime when the selected runtime provider is healthy, otherwise it falls back honestly to the local deterministic pipeline.

- `AUTHRIX_ENGINEER_EXECUTION=local`
  Always use the local deterministic engineering pipeline.

- `AUTHRIX_ENGINEER_EXECUTION=runtime`
  Always try the runtime first, but Authrix will still fall back visibly if the runtime call fails.

The Connections page and Dashboard now show pipeline health so you can see whether engineering intelligence came from a runtime-backed path or a fallback path.

The same execution modes exist for:
- `AUTHRIX_DOCS_EXECUTION`
- `AUTHRIX_TASK_EXECUTION`
- `AUTHRIX_WORKFLOW_EXECUTION`

These default to `auto`.

Meeting intake is now a first-class persisted path:
- `POST /api/source-documents` accepts manual notes or transcript-style payloads
- `GET /api/meeting-artifacts` returns structured meeting outputs
- `GET /api/decision-records` returns durable decision records
- `GET/PATCH /api/tasks` returns or updates persisted task follow-through state

Optional documentation sink beyond GitHub:
- Set `NOTION_API_TOKEN` and `NOTION_PARENT_PAGE_ID` to let approved `docs.update` actions publish into Notion through the backend adapter
- If Notion is not configured, approved docs updates are written to `.authrix-data/generated-docs/operational-updates.md`

## Manual Persisted Inputs

Phase 4 now supports persisted non-GitHub inputs through backend routes.

- `POST /api/source-documents`
  Add a persisted meeting note, transcript, or manual document source.

- `PUT /api/cost-report`
  Replace the current persisted cost report with a manually provided report payload.

These routes rebuild the shared workspace snapshot after writing the new source input so downstream docs, workflow, tasks, risk, and approvals stay in sync.

## Refresh Jobs

Authrix now exposes a persisted refresh job path:

- `POST /api/workspace/jobs`
  Queue a workspace refresh job or a Slack briefing job

- `GET /api/workspace/jobs`
  List recent refresh jobs

- `GET /api/workspace/jobs/:jobId`
  Inspect one refresh job

This is the first real job surface for the control tower and is separate from the direct `/api/workspace/state` refresh path.

Slack briefing jobs use:
- `POST /api/workspace/jobs` with `{ "type": "slack.briefing.run", "scheduleId": "briefing-daily-ops" }`

## Chat-Native Operations

Phase 12 turns Slack into a more operational surface instead of a simple inbox.

Authrix now supports:
- persisted delegation history between internal specialists
- scheduled briefing definitions for daily and weekly proactive updates
- generated and delivered Slack briefing records
- chat-native follow-up capture that feeds the control tower
- model-routed chat workload visibility as a spend proxy

Current note:
- direct model spend metering is not wired yet, so the dashboard shows routed model activity rather than exact billing totals

## Deployment APIs

Phase 7 adds operator-facing bring-up APIs:

- `GET /api/deployment/readiness`
  Returns the current worker-box readiness report, including deployment checks and onboarding checklist state.

- `GET /api/deployment/smoke-test`
  Runs non-destructive deployment smoke checks over persisted state, runtime status, security posture, and job surfaces.

## Operational Drift

Phase 8 now includes persisted drift detection and drift-backed autonomy suggestions.

Authrix now surfaces drift signals when:
- engineering activity outpaces persisted docs input
- accepted decisions are missing follow-through tasks
- open questions keep recurring across meetings
- the execution backlog grows faster than work is being cleared
- cost anomalies appear without matching visible product activity
- approvals stay pending long enough to slow execution

These drift signals flow through the same shared workspace snapshot, pipeline state, alert surfaces, and proposed-action pipeline as the rest of the product.

## Approval-Backed GitHub Writes

Approved `github.issue.create` actions can now execute through a real mediated backend adapter.

The approval route will:
- approve the action in product state
- attempt the GitHub write through Auth0 Token Vault or a configured PAT
- persist the execution result back into audit history and the timeline

This keeps the write path backend-mediated and approval-aware instead of simulated.

