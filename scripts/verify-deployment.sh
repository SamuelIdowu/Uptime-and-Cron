#!/bin/bash

# SteadyState Deployment Verification Script
# This script checks the readiness of the codebase for Vercel deployment (Option A).

echo "🔍 Verifying deployment configuration..."

# 1. Check for required files
FILES=(
  "vercel.json"
  "apps/web/app/api/cron/worker/route.ts"
  "apps/web/lib/worker/poller.ts"
  "apps/web/lib/worker/heartbeat-checker.ts"
  "apps/web/lib/worker/alert-sweeper.ts"
  "apps/web/lib/worker/aggregator.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Found $file"
  else
    echo "❌ Missing $file"
    exit 1
  fi
done

# 2. Verify vercel.json structure
echo "📝 Checking vercel.json..."
TICK_CRON=$(grep -c "/api/cron/worker?task=tick" vercel.json)
AGG_CRON=$(grep -c "/api/cron/worker?task=aggregate" vercel.json)

if [ "$TICK_CRON" -ge 1 ] && [ "$AGG_CRON" -ge 1 ]; then
  echo "✅ vercel.json contains both tick and aggregate tasks"
else
  echo "❌ vercel.json is missing required cron tasks"
  exit 1
fi

# 3. Verify Cron Route Configuration
echo "📝 Checking Cron Route configuration..."
MAX_DUR=$(grep -c "export const maxDuration = 60" apps/web/app/api/cron/worker/route.ts)
DYN_CFG=$(grep -c "export const dynamic = \"force-dynamic\"" apps/web/app/api/cron/worker/route.ts)

if [ "$MAX_DUR" -ge 1 ] && [ "$DYN_CFG" -ge 1 ]; then
  echo "✅ Cron route has correct performance/segment configurations"
else
  echo "⚠️ Cron route might be missing maxDuration or force-dynamic settings"
fi

# 4. Environment Variable Presence in .env.example
echo "📝 Checking .env.example coverage..."
VARS=(
  "DATABASE_URL"
  "DIRECT_URL"
  "CLERK_SECRET_KEY"
  "UPSTASH_REDIS_REST_URL"
  "RESEND_API_KEY"
  "ENCRYPTION_KEY"
  "INTERNAL_API_SECRET"
)

MISSING_VARS=0
for var in "${VARS[@]}"; do
  if ! grep -q "$var" apps/web/.env.example; then
    echo "⚠️  Missing $var in apps/web/.env.example"
    MISSING_VARS=$((MISSING_VARS+1))
  fi
done

if [ $MISSING_VARS -eq 0 ]; then
  echo "✅ All critical variables found in .env.example"
else
  echo "ℹ️  Some variables are missing from .env.example, ensure they are set in Vercel."
fi

echo ""
echo "🎉 Deployment verification complete! Ready for Vercel."
