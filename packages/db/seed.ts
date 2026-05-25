import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try common .env locations in a monorepo
const envPaths = [
  path.resolve(__dirname, "../../.env"),            // Root
  path.resolve(__dirname, "../../apps/web/.env"),    // Web App
  path.resolve(__dirname, "../../apps/worker/.env"), // Worker
  path.resolve(__dirname, ".env"),                   // Local
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

import { db } from "./index";
import * as schema from "./schema";
import { subDays, subHours, subMinutes } from "date-fns";

async function main() {
  console.log("Seeding database...");

  // 1. Get or Create a test user
  // Note: Replace this ID with your actual Clerk user ID if you want to see data in your dashboard
  const TEST_USER_ID = "user_test_123"; 
  
  const [user] = await db.insert(schema.users).values({
    id: TEST_USER_ID,
    email: "test@example.com",
    plan: "free",
  }).onConflictDoUpdate({
    target: schema.users.id,
    set: { email: "test@example.com" }
  }).returning();

  console.log(`User seeded: ${user.id}`);

  // 2. Create Alert Settings
  await db.insert(schema.alertSettings).values({
    userId: user.id,
    email: user.email,
  }).onConflictDoNothing();

  // 3. Create Monitors
  const monitorNames = ["Primary API", "Web Frontend", "Auth Service", "DB Cluster"];
  const monitorUrls = [
    "https://api.example.com/health",
    "https://example.com",
    "https://auth.example.com",
    "https://db.example.com"
  ];

  for (let i = 0; i < monitorNames.length; i++) {
    const [monitor] = await db.insert(schema.monitors).values({
      userId: user.id,
      name: monitorNames[i],
      url: monitorUrls[i],
      status: i === 2 ? "down" : "up",
      intervalMinutes: 5,
      uptime7d: i === 2 ? "98.50" : "100.00",
      avgResponseMs: 120 + i * 40,
    }).returning();

    // Add some checks
    const checks = [];
    for (let j = 0; j < 50; j++) {
      checks.push({
        monitorId: monitor.id,
        status: (i === 2 && j < 5) ? "down" : "up" as const,
        httpStatus: (i === 2 && j < 5) ? 500 : 200,
        responseMs: Math.round(100 + Math.random() * 200),
        createdAt: subMinutes(new Date(), j * 5),
      });
    }
    await db.insert(schema.monitorChecks).values(checks);
    console.log(`Monitor seeded: ${monitor.name}`);
  }

  // 4. Create Heartbeats
  const heartbeatNames = ["Daily Backup", "Clear Cache", "Email Processor"];
  for (let i = 0; i < heartbeatNames.length; i++) {
    const [heartbeat] = await db.insert(schema.heartbeatMonitors).values({
      userId: user.id,
      name: heartbeatNames[i],
      pingToken: `token_${i}_${Math.random().toString(36).slice(2)}`,
      periodMinutes: i === 0 ? 1440 : 60,
      status: i === 1 ? "late" : "up",
    }).returning();

    // Add some pings
    const pings = [];
    for (let j = 0; j < 20; j++) {
      pings.push({
        heartbeatId: heartbeat.id,
        receivedAt: subHours(new Date(), j * (i === 0 ? 24 : 1)),
        exitCode: 0,
      });
    }
    await db.insert(schema.heartbeatPings).values(pings);
    console.log(`Heartbeat seeded: ${heartbeat.name}`);
  }

  console.log("Seeding completed successfully.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
