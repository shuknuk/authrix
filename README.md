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

See `/docs/agent-security-architecture.md` for details.

## Local Auth0 Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your Auth0 tenant values.
3. Generate `AUTH0_SECRET` with a 32-byte hex string.
4. In the Auth0 dashboard, configure:
   - Allowed Callback URLs: `http://localhost:3000/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
   - Application Login URI: `http://localhost:3000/auth/login`

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

If no live GitHub configuration is present, Authrix stays in mock mode and labels that clearly in the Connections page. When Auth0 is configured, the Connections page exposes a `Connect GitHub With Auth0` action that uses the SDK's built-in `/auth/connect` flow.

## Runtime Foundation

Authrix keeps the product layer separate from the autonomous runtime. By default, the app uses the local mock runtime bridge so the dashboard stays deterministic and demo-safe.

To point Authrix at a live OpenClaw gateway:

1. Run a separate OpenClaw gateway process outside this app.
2. Set `AUTHRIX_RUNTIME=openclaw`.
3. Configure `OPENCLAW_GATEWAY_URL`.
4. Add `OPENCLAW_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_PASSWORD` if your gateway requires credentials.
5. Optional: set `OPENCLAW_AGENT_ID` if you want all Authrix runtime calls to target one configured runtime agent.

The Connections page now shows whether Authrix is on the mock bridge, connected to a live runtime, or disconnected from the configured gateway.

Important note: the runtime adapter is now real, but the product is still mock-first. The adapter can execute runtime-backed agent calls when your OpenClaw agent is configured to return JSON-only outputs. Until those runtime prompts are tuned, the default `mock` provider remains the safest path for normal dashboard work.

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
- `AUTHRIX_TASK_EXECUTION`
- `AUTHRIX_WORKFLOW_EXECUTION`

These default to `auto`.

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
  Queue a workspace refresh job

- `GET /api/workspace/jobs`
  List recent refresh jobs

- `GET /api/workspace/jobs/:jobId`
  Inspect one refresh job

This is the first real job surface for the control tower and is separate from the direct `/api/workspace/state` refresh path.

## Approval-Backed GitHub Writes

Approved `github.issue.create` actions can now execute through a real mediated backend adapter.

The approval route will:
- approve the action in product state
- attempt the GitHub write through Auth0 Token Vault or a configured PAT
- persist the execution result back into audit history and the timeline

This keeps the write path backend-mediated and approval-aware instead of simulated.

