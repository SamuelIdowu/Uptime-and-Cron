import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

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

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your shell environment or one of these files: packages/db/.env, project root .env, apps/web/.env, apps/worker/.env."
  );
}

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
