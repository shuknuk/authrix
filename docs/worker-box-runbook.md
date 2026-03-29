# Authrix Worker-Box Runbook

This runbook is the operational bring-up guide for running Authrix on a dedicated worker machine.

## Recommended Host Model

Preferred target:
- a separate mini PC, desktop, VM, or VPS dedicated to Authrix

Avoid:
- your everyday personal laptop
- a machine that already holds browser sessions, password-manager state, SSH keys, and unrelated private documents

## Bring-Up Checklist

1. Install Node.js 22+ on the worker machine.
2. Clone the Authrix repository onto the worker machine.
3. Copy `.env.example` to `.env.local`.
4. Fill in the required Auth0 values.
5. Set `AUTHRIX_DEPLOYMENT_MODE=worker-box`.
6. Set `GITHUB_OWNER` and `GITHUB_REPO`.
7. Choose the runtime mode:
   - keep `AUTHRIX_RUNTIME=mock` for a safer first boot
   - switch to `AUTHRIX_RUNTIME=openclaw` when the internal runtime transport is ready
8. Keep `AUTHRIX_ALLOW_EXTERNAL_WRITES=false` for the first bring-up unless you are intentionally testing approved writes.
9. Keep `AUTHRIX_RUNTIME_ALLOW_HOST_TOOLS=false` unless you have a very specific reason to loosen host-tool access.

## Install Flow

From the repo root:

```powershell
npm.cmd install
npm.cmd run build
node scripts/check-worker-box.mjs
```

What this verifies:
- build dependencies install cleanly
- the production build compiles
- key worker-box environment variables are present
- `.authrix-data` is writable

## Startup Guidance

For a manual production-style start:

```powershell
npm.cmd run start
```

For local development on a worker box while still testing:

```powershell
npm.cmd run dev
```

Use `npm.cmd run start` for real deployment smoke tests, not `dev`.

## Restart Guidance

If the app stops or you update the code:

1. stop the current process
2. pull the latest code
3. run `npm.cmd install` if dependencies changed
4. run `npm.cmd run build`
5. restart with `npm.cmd run start`
6. run `node scripts/smoke-worker-box.mjs`

For later production hardening, Authrix should eventually be wrapped in a proper service manager such as:
- Windows Task Scheduler or NSSM on Windows
- `systemd` on Linux
- a container or process supervisor on VPS targets

## Connection Onboarding

After the app is up:

1. sign into Authrix with Auth0
2. open the Connections page
3. confirm the Security Posture card matches the expected worker-box boundary
4. finish the `Connect GitHub With Auth0` flow
5. verify GitHub moves out of mock/fallback posture
6. review deployment readiness and smoke-test cards

## First Deployment Smoke Test

Run the local smoke script:

```powershell
node scripts/smoke-worker-box.mjs
```

Then verify inside the control tower:
- Connections shows the runtime posture honestly
- Security Posture has no unexpected warnings
- Deployment Readiness is not blocked
- Deployment Smoke Test shows no failed checks
- GitHub integration is connected or clearly marked as pending
- the workspace snapshot is persisted

Optional final validation:

```powershell
npm.cmd run build
```

## Safer Defaults For First Bring-Up

Recommended first-boot posture:
- `AUTHRIX_ALLOW_EXTERNAL_WRITES=false`
- `AUTHRIX_ALLOW_PERSONAL_ACCESS_TOKEN_FALLBACK=false`
- `AUTHRIX_ALLOW_TOKEN_VAULT_GITHUB_ACCESS_TOKEN_OVERRIDE=false`
- `AUTHRIX_RUNTIME_ALLOW_HOST_TOOLS=false`

This keeps Authrix conservative while you validate the worker box.
