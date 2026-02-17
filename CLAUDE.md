# Client Onboarding - Huddle Duck

## Purpose
Leadsie-style client onboarding tool. Clients click a link, log in with Facebook, select their ad account, and we automatically get partner access + run a health check + provision them into our system.

## Tech Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- Turso (shared DB with client-dashboards)
- Facebook JavaScript SDK for OAuth
- Meta Graph API v21.0 for partner access + health checks

## Architecture
- Single-page app with 3 states: Welcome → Select Account → Success
- Facebook OAuth with `business_management` scope only
- Backend API routes handle: account discovery, partner access grant, health check, provisioning
- Provisioning creates: Notion page + Turso client row + triggers backfill on client-dashboards

## Key Files
| File | Purpose |
|---|---|
| `src/app/OnboardClient.tsx` | Main client component (FB login + account picker + status) |
| `src/lib/meta-partner.ts` | Facebook Graph API: discover BMs, grant partner access |
| `src/lib/meta-health.ts` | Ad account health check (account_status, disable_reason) |
| `src/lib/provision.ts` | Orchestrator: Notion + Turso + backfill trigger |
| `src/app/privacy/page.tsx` | Privacy policy (required for Meta App Review) |

## Environment Variables
```
TURSO_DATABASE_URL          # Same as client-dashboards
TURSO_AUTH_TOKEN             # Same as client-dashboards
META_ACCESS_TOKEN            # Same as client-dashboards
NOTION_TOKEN                 # Same as client-dashboards
NEXT_PUBLIC_FB_APP_ID        # Meta app ID (client-side)
HUDDLE_DUCK_BM_ID            # Agency's Business Manager ID
CLIENT_DASHBOARDS_URL        # e.g. https://clients.huddleduck.co.uk
CLIENT_DASHBOARDS_SECRET     # Same as CRON_SECRET in client-dashboards
```

## Meta App Review Status
- `business_management`: Standard Access (previously rejected — privacy policy URL was broken and screencast didn't show live app)
- Fix: deploy with working /privacy page, record screencast of live app, resubmit

## Database
Uses existing Turso DB. Adds one new table: `onboarding_requests` (created lazily via schema.ts).
Writes to existing `clients` table during provisioning.
