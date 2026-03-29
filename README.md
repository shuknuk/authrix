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

