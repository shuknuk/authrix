# Authrix

Authrix is a hackathon MVP for a secure startup operations dashboard powered by narrow AI agents.

## Core flow
- Auth0 login
- GitHub connection
- normalized engineering activity
- weekly summary from the engineer agent
- suggested follow-up tasks from the task agent
- API spend and risk insight from the devops agent
- approval-gated write actions

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Auth0
- GitHub OAuth
- Mock-first typed agent pipeline

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Fill in your Auth0 and GitHub OAuth credentials.
3. Register these callback URLs:
   - Auth0 callback: `http://localhost:3000/auth/callback`
   - Auth0 logout: `http://localhost:3000`
   - GitHub callback: `http://localhost:3000/api/github/callback`
4. Install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Security model

- Agents do not store credentials.
- External integrations are mediated through backend route handlers only.
- Agents exchange structured outputs instead of raw context.
- Every write action is blocked behind an explicit approval modal and `/api/execute` approval check.

## Routes

- `/dashboard`
- `/connections`
- `/activity`
- `/tasks`
- `/costs`

## Development notes

- GitHub ingestion is mock-first. When live GitHub activity is missing or sparse, the app falls back to clearly labeled mock data to keep the demo reliable.
- Approval queue items are kept in memory for the MVP. They update on refresh but are not persisted across server restarts.
- See [docs/architecture.md](./docs/architecture.md) and [docs/demo-script.md](./docs/demo-script.md) for product framing.
