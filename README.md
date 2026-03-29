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

