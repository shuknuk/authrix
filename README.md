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

