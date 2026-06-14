# Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage (to install all dependencies including dev)
FROM base AS builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Runner stage
FROM base AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy necessary files for pnpm workspace
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/pnpm-workspace.yaml .
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/notifications ./packages/notifications
COPY --from=builder /app/apps/worker/src ./apps/worker/src

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production

# Start the worker using the start script in package.json (uses tsx)
CMD ["pnpm", "--filter", "@steady-state/worker", "start"]
