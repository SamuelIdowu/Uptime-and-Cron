# SteadyState: Feature & Architecture Map

SteadyState is an industrial-grade infrastructure monitoring and visibility platform. It provides real-time HTTP/HTTPS monitoring, heartbeat (cron) tracking, and public-facing status pages with robust alerting and team management.

## 🚀 Core Features

### 1. HTTP/HTTPS Monitoring
*   **Active Polling**: Global monitoring of web endpoints with configurable intervals (1-60m).
*   **Consensus Logic**: Multi-target checks (Any, All, Quorum) to prevent false positives.
*   **Advanced Assertions**: Validation of HTTP status codes, response body text, regex patterns, and JSONPath values.
*   **SSL Intelligence**: Automatic tracking of SSL certificate expiration with proactive alerting 7 days before expiry.

### 2. Heartbeat (Passive) Monitoring
*   **Cron Tracking**: Monitor recurring tasks or background jobs.
*   **Token-based Access**: Unique endpoints for every heartbeat monitor.
*   **Grace Periods**: Configurable period and grace windows to handle slight execution delays.
*   **Telemetry**: Capture IP address, duration, exit codes, and logs for every ping.

### 3. Public Status Pages
*   **Public Visibility**: High-performance public URLs (`/status/[slug]`) for infrastructure transparency.
*   **Historical Context**: 30-day uptime bars and real-time health summaries.
*   **Custom Branding**: Support for custom logos, descriptions, and primary brand colors.
*   **Management**: Dedicated dashboard to provision, update, and delete public pages.

### 4. Alerting & Integrations
*   **Multi-Channel Delivery**: Instant notifications via **Slack**, **Telegram**, and **Email** (Resend).
*   **Security First**: AES-256-GCM versioned encryption for all integration credentials.
*   **Alert Outbox**: Robust delivery pattern ensuring alerts are queued and retried until sent.
*   **Connection Testing**: Integrated tools to verify integration settings instantly.

### 5. Team Management (RBAC)
*   **Collaborative Workspaces**: Invite-based access for multiple operators.
*   **Granular Roles**: 
    *   **Owner**: Full workspace authority.
    *   **Admin**: Manage infrastructure, team members, and settings.
    *   **Viewer**: Read-only access to metrics and status.
*   **Secure Invitations**: Tokenized email invites with 7-day expiration.

### 6. Maintenance Windows
*   **Planned Downtime**: Schedule maintenance to silence alerts and preserve uptime stats.
*   **Scoping**: Target specific Monitors, Heartbeats, or "Global Infrastructure".
*   **Timeline View**: Track active, upcoming, and expired maintenance events.

---

## 🗺️ Page Map

### **Dashboard (Protected)**
Located in `apps/web/app/(dashboard)/[workspaceId]/`
- `/dashboard`: Real-time overview of all monitors and heartbeats.
- `/monitors`: Full list and detailed view of HTTP monitors.
- `/heartbeats`: Full list and detailed view of cron monitors.
- `/status-pages`: Management interface for public status pages.
- `/incidents`: Global timeline of all downtime events.
- `/maintenance`: Scheduling and management of maintenance windows.
- `/integrations`: Configuration for Slack, Telegram, and Email alerts.
- `/team`: Workspace membership and invitation management.
- `/settings`: General workspace and profile configuration.

### **Public & Utility**
- `/status/[slug]`: The public-facing system health interface.
- `/invite/[token]`: Landing page for joining a workspace.
- `/sign-in`, `/sign-up`: Authentication handled via Clerk.

---

## ⚡ Action Map

| Area | Actions |
| :--- | :--- |
| **Monitors** | Create Monitor, Edit Config, Pause/Resume, Delete, View Raw Logs |
| **Heartbeats** | Create Heartbeat, **Rotate Token**, Pause/Resume, View Ping Logs |
| **Status Pages** | **Provision Page**, Update Branding, Link/Unlink Monitors, Delete |
| **Team** | **Invite Operator**, Revoke Member, Revoke Pending Invite, Accept Invite |
| **Maintenance** | **Schedule Window**, Cancel Upcoming Window, Edit Window |
| **Integrations** | Save Slack/Telegram Credentials, **Test Connection** |

---

## 🛠️ System Services (Workers)
Background tasks located in `apps/worker/src/`

1.  **Poller (`poller.ts`)**: Executes HTTP/HTTPS checks, validates assertions, and triggers status changes.
2.  **Heartbeat Checker (`heartbeat-checker.ts`)**: Identifies late or missing pings and transitions monitors to "LATE" or "DOWN".
3.  **Alert Sweeper (`alert-sweeper.ts`)**: Monitors the alert outbox and dispatches notifications via Slack, Telegram, or Resend.
4.  **Aggregator (`aggregator.ts`)**: Processes raw check/ping data into daily uptime rollups and caches stats for dashboard performance.

---

## 🔌 API Map
Key endpoints in `apps/web/app/api/`

- `/api/ping/[token]`: High-performance telemetry endpoint for heartbeats (Rate-limited via Upstash).
- `/api/status/[slug]`: Public data endpoint for status page hydration.
- `/api/team/invite`: Management of workspace operators.
- `/api/settings/slack/test`: Live verification of notification delivery.
- `/api/status-pages/check-slug`: Real-time uniqueness validation for status URLs.
