import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, "../..");

const envCandidates = [
  join(configDir, ".env.local"),
  join(configDir, ".env"),
  join(repoRoot, ".env.local"),
  join(repoRoot, ".env"),
  join(repoRoot, "apps/web/.env.local"),
  join(repoRoot, "apps/web/.env"),
  join(repoRoot, "apps/worker/.env.local"),
  join(repoRoot, "apps/worker/.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: false });
  }
}

const databaseUrl = process.env.DATABASE_URL;

// Initialize lazily to avoid errors during import if env is not yet loaded
let sql: any;
export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!sql) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error("DATABASE_URL is not set. Ensure .env is loaded before accessing the database.");
      }
      sql = neon(url);
    }
    const d = drizzle(sql, { schema });
    return Reflect.get(d, prop, receiver);
  }
});

let readSql: any;
export const readDb = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!readSql) {
      const url = process.env.READ_DATABASE_URL || process.env.DATABASE_URL;
      if (!url) {
        throw new Error("DATABASE_URL is not set. Ensure .env is loaded before accessing the database.");
      }
      readSql = neon(url);
    }
    const d = drizzle(readSql, { schema });
    return Reflect.get(d, prop, receiver);
  }
});

export * from "./schema";

export async function dispatchAlerts(
  monitorId: string | null,
  heartbeatId: string | null,
  status: "up" | "down" | "late" | "recovered"
) {
  try {
    let userId: string | null = null;

    if (monitorId) {
      const monitor = await db.query.monitors.findFirst({
        where: eq(schema.monitors.id, monitorId),
      });
      if (monitor) userId = monitor.userId;
    } else if (heartbeatId) {
      const heartbeat = await db.query.heartbeatMonitors.findFirst({
        where: eq(schema.heartbeatMonitors.id, heartbeatId),
      });
      if (heartbeat) userId = heartbeat.userId;
    }

    if (!userId) {
      console.warn(`[AlertDispatcher] Monitor or Heartbeat not found`);
      return;
    }

    const settings = await db.query.alertSettings.findFirst({
      where: eq(schema.alertSettings.userId, userId),
    });

    if (!settings) {
      console.log(`[AlertDispatcher] Alert settings not found for user ${userId}`);
      return;
    }

    const pendingAlerts = [];

    // 1. Email Alert
    if (settings.email) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "email" as const,
        status: "pending" as const,
      });
    }

    // 2. Slack Alert
    if (settings.slackWebhookUrl) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "slack" as const,
        status: "pending" as const,
      });
    }

    // 3. Telegram Alert
    if (settings.telegramChatId && settings.telegramBotToken) {
      pendingAlerts.push({
        userId,
        monitorId,
        heartbeatId,
        type: status,
        channel: "telegram" as const,
        status: "pending" as const,
      });
    }

    if (pendingAlerts.length > 0) {
      await db.insert(schema.alerts).values(pendingAlerts);
      console.log(`[AlertDispatcher] Created ${pendingAlerts.length} pending alerts in outbox.`);
    }
  } catch (error) {
    console.error("[AlertDispatcher] Error queuing alerts:", error);
  }
}
