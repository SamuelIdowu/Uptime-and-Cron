# Implementation Plan: App URL Configuration & Robust Ping URLs

## Overview
Currently, the application defaults to `localhost:3000` for generated Heartbeat Ping URLs when `NEXT_PUBLIC_APP_URL` is not set. Users lack a UI to configure this base URL, which causes friction when deploying or using local tunnels. We will implement a "Public App URL" setting and improve how Ping URLs are displayed and copied across the application.

## Tasks

### Phase 1: Database & Schema
- [ ] Add `appUrl` column to `users` table in `packages/db/schema.ts` (Est: 1h)
- [ ] Generate and run migration (Est: 0.5h)

### Phase 2: API & Backend
- [ ] Update `/api/settings` (or create `/api/user/settings`) to allow updating `appUrl` (Est: 1h)
- [ ] Update `HeartbeatDetailPage` to use a more robust URL detection (Est: 1h)
  - Prioritize `user.appUrl`
  - Fallback to `NEXT_PUBLIC_APP_URL`
  - Final fallback to current request `host` via `headers()`

### Phase 3: UI Settings
- [ ] Add "System Configuration" section to `apps/web/app/(dashboard)/[workspaceId]/settings/page.tsx` (Est: 2h)
- [ ] Create `AppUrlForm` component (Est: 2h)
- [ ] Update `.env.example` to include `NEXT_PUBLIC_APP_URL` (Est: 0.1h)

### Phase 4: UI Enhancements
- [ ] Update `MonitorTable` to include a "Copy Ping URL" action for heartbeats (Est: 1h)
- [ ] Update `HeartbeatDetailPage` to show the full URL more prominently (Est: 1h)

## Dependencies
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Invalid URL format | Low | Add Zod validation for the URL setting |
| SSR/Client mismatch | Low | Use consistent detection logic or pass URL from server to client |

## Timeline
- Day 1: Phases 1 & 2
- Day 2: Phases 3 & 4
