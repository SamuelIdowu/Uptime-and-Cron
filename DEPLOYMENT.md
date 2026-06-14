# SteadyState Deployment Guide

This guide outlines the steps required to deploy SteadyState to a production environment.

## 🏗️ Architecture Overview
SteadyState consists of three main components:
1.  **Web App (`apps/web`)**: Next.js application (Frontend, API, and Cron Workers). Optimized for **Vercel**.
2.  **Worker (`apps/worker`)**: Node.js background service. Optional if using Vercel Crons.
3.  **Database**: PostgreSQL managed via **Neon**.

---

## 🚀 Deployment Strategies

### Option A: Serverless (Vercel Only) - **Recommended for simplicity**
This option uses Vercel Cron Jobs to run the monitoring logic. No separate VPS or Docker container is required. The background tasks have been refactored into the Web App for this purpose.

1.  **Deploy Web App**: Deploy `apps/web` to Vercel.
2.  **Database Migration**: Ensure your Neon database is up-to-date (see Database Setup below).
3.  **Configure Cron Secret**: Add `CRON_SECRET` to your Vercel Environment Variables. This secures your cron endpoints.
4.  **Vercel Crons**: Vercel will automatically detect `vercel.json` and schedule the tasks:
    -   `tick`: Every minute (Poller, Heartbeats, Alerts).
    -   `aggregate`: Daily at 00:05 (Analytics aggregation).
5.  **Note**: This requires a **Vercel Pro** plan for 1-minute frequency. Hobby plans are limited to 1/day, which is insufficient for real-time monitoring.

### Option B: Hybrid (Vercel + VPS)
Use Vercel for the UI/API and a separate VPS for the background worker (`apps/worker`). This is more precise for high-frequency monitoring and doesn't require a Vercel Pro plan.

---

## 🔑 Infrastructure Requirements

You will need accounts and API keys for the following services:

| Service | Purpose |
| :--- | :--- |
| **Clerk** | Authentication & User Management |
| **Neon** | Serverless Postgres Database |
| **Upstash** | Global Rate Limiting (Redis) |
| **Resend** | Transactional Email (Alerts/Invites) |
| **Sentry** | Error Tracking (Optional) |
| **PostHog** | Product Analytics (Optional) |

---

## ⚙️ Environment Variables

Copy the following variables into your production environment settings.

### Web Application (`apps/web`)
| Variable | Description | Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon connection string (Pooler) | Neon |
| `DIRECT_URL` | Neon connection string (Direct) | Neon |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key | Clerk |
| `CLERK_SECRET_KEY` | Clerk Secret Key | Clerk |
| `UPSTASH_REDIS_REST_URL` | Redis URL | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Redis Token | Upstash |
| `RESEND_API_KEY` | Email API Key | Resend |
| `RESEND_FROM_EMAIL` | Sender Email | Resend |
| `ENCRYPTION_KEY` | 32-byte hex string (64 chars) | `openssl rand -hex 32` |
| `INTERNAL_API_SECRET` | Secure random string | `openssl rand -base64 32` |
| `CRON_SECRET` | Secret for Vercel Cron | Vercel / Custom |
| `NEXT_PUBLIC_APP_URL` | Your production URL | Production |

### Worker Service (`apps/worker`)
*Only required if using Option B*
```env
DATABASE_URL=...
ENCRYPTION_KEY=... # Must match the Web App key
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
WEB_APP_URL=...
INTERNAL_API_SECRET=... # Must match the Web App key
```

---

## 🚀 Deployment Steps

### 1. Database Setup
1. Create a new project in **Neon**.
2. Run migrations from your local machine (ensure `DATABASE_URL` is set to production):
   ```bash
   pnpm db:migrate
   ```

### 2. Web App (Vercel)
1. Import the repository into **Vercel**.
2. Set the **Root Directory** to `apps/web`.
3. Add all environment variables listed above.
4. Set the **Output Directory** if not detected (usually `.next`).
5. Deployment will trigger automatically on push to `main`.

### 3. Final Production Checklist (Option A)
- [ ] **Database**: Migrations applied to the production Neon instance.
- [ ] **Clerk**: Production keys configured and domain/redirects set in Clerk Dashboard.
- [ ] **Resend**: Domain verified and `RESEND_FROM_EMAIL` matches the verified domain.
- [ ] **Cron**: `CRON_SECRET` added to Vercel env vars.
- [ ] **Rate Limiting**: `UPSTASH_REDIS_*` vars set (crucial for `/api/ping` security).
- [ ] **Encryption**: `ENCRYPTION_KEY` is a fresh 64-character hex string.
- [ ] **Vercel Pro**: Ensure your Vercel project is on a Pro team for 1-minute crons.

---

## 🚀 VPS Deployment (Option B Only)
The worker must be a long-running process. We provide a `Dockerfile` and `docker-compose.yml`.

---

## 🛡️ Security Checklist
- [ ] **Encryption Key**: Ensure `ENCRYPTION_KEY` is a cryptographically strong hex string.
- [ ] **Domain Verification**: Verify your domain in **Resend** to ensure high email deliverability.
- [ ] **Rate Limiting**: Confirm Upstash variables are set to enable global protection on the ping endpoint.
- [ ] **SSL Policy**: Ensure the worker has access to the public internet to verify SSL certificates.

---

## 📈 Monitoring the Deployment
- **Web**: Check Vercel Logs for API errors.
- **Worker**: Monitor worker logs to ensure the `Poller` and `Alert Sweeper` are running every minute.
- **Database**: Use `pnpm db:studio` locally (pointed at prod) to inspect system health records.
