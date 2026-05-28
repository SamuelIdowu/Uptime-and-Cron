# SteadyState

A high-performance, full-stack uptime and heartbeat monitoring solution.

## 🚀 Overview

SteadyState provides real-time monitoring for web services and cron jobs. It features a modern dashboard, high-frequency polling, and a robust notification system to ensure you are the first to know when things go down.

## ✨ Features

- **HTTP/SSL Monitoring:** Active polling of endpoints with support for status codes, SSL certificate expiry, and body content assertions (Text, Regex, JSONPath).
- **Heartbeat (Cron) Monitoring:** Passive monitoring for scheduled tasks; alerting you when a service fails to check in.
- **Real-time Alerts:** Multi-channel notifications via **Email (Resend)**, **Slack**, and **Telegram**.
- **Performance Analytics:** Visual uptime bars, response time charts, and daily aggregated performance stats.
- **Multi-tenancy:** Built-in support for workspaces and team collaboration.

## 🏗️ Architecture

SteadyState is built as a TypeScript monorepo using **Turbo** and **pnpm**:

- **`apps/web`**: Next.js 14 (App Router) dashboard and API.
- **`apps/worker`**: Scalable Node.js background worker for polling and data aggregation.
- **`packages/db`**: Shared database layer using **Drizzle ORM** and **Postgres**.
- **`packages/notifications`**: Unified notification engine.

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Authentication:** Clerk
- **Styling:** Tailwind CSS, Framer Motion, Shadcn UI
- **Tooling:** Turbo, pnpm

## 🚦 Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) installed.
- Node.js 18+

### Setup

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` in `apps/web` and `apps/worker` to `.env` and fill in your credentials (Clerk, Neon, Resend, etc.).

3.  **Database Migration:**
    ```bash
    pnpm --filter db push
    ```

4.  **Run Development Mode:**
    ```bash
    pnpm dev
    ```
