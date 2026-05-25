import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  decimal,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const planEnum = pgEnum("plan", ["free", "paid"]);
export const monitorStatusEnum = pgEnum("monitor_status", [
  "up",
  "down",
  "paused",
  "pending",
]);
export const heartbeatStatusEnum = pgEnum("heartbeat_status", [
  "up",
  "late",
  "down",
  "paused",
  "pending",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "down",
  "up",
  "late",
  "recovered",
]);
export const alertChannelEnum = pgEnum("alert_channel", ["email", "slack"]);
export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "sent",
  "failed",
  "dead",
]);

// Tables
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    intervalMinutes: integer("interval_minutes").notNull().default(5),
    expectedStatus: integer("expected_status").notNull().default(200),
    status: monitorStatusEnum("status").notNull().default("pending"),
    lastCheckedAt: timestamp("last_checked_at"),
    lastStatusChangeAt: timestamp("last_status_change_at"),
    uptime7d: decimal("uptime_7d", { precision: 5, scale: 2 }),
    uptime30d: decimal("uptime_30d", { precision: 5, scale: 2 }),
    avgResponseMs: integer("avg_response_ms"),
    paused: boolean("paused").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("monitors_user_id_idx").on(table.userId),
    lastCheckedIdx: index("monitors_last_checked_idx").on(table.lastCheckedAt),
    pausedLastCheckedIdx: index("monitors_paused_last_checked_idx").on(
      table.paused,
      table.lastCheckedAt
    ),
  })
);

export const monitorEvents = pgTable(
  "monitor_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    status: pgEnum("event_status", ["down", "up"])("status").notNull(),
    httpStatus: integer("http_status"),
    responseMs: integer("response_ms"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at").notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    monitorIdStartedAtIdx: index("monitor_events_monitor_id_started_at_idx").on(
      table.monitorId,
      table.startedAt
    ),
  })
);

export const heartbeatMonitors = pgTable(
  "heartbeat_monitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    pingToken: varchar("ping_token", { length: 64 }).notNull().unique(),
    periodMinutes: integer("period_minutes").notNull(),
    graceMinutes: integer("grace_minutes").notNull().default(5),
    status: heartbeatStatusEnum("status").notNull().default("pending"),
    lastPingAt: timestamp("last_ping_at"),
    paused: boolean("paused").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("heartbeat_monitors_user_id_idx").on(table.userId),
    pingTokenIdx: index("heartbeat_monitors_ping_token_idx").on(table.pingToken),
    lastPingIdx: index("heartbeat_monitors_last_ping_idx").on(table.lastPingAt),
  })
);

export const heartbeatPings = pgTable(
  "heartbeat_pings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    heartbeatId: uuid("heartbeat_id")
      .notNull()
      .references(() => heartbeatMonitors.id, { onDelete: "cascade" }),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    sourceIp: varchar("source_ip", { length: 45 }),
  },
  (table) => ({
    heartbeatIdReceivedAtIdx: index(
      "heartbeat_pings_heartbeat_id_received_at_idx"
    ).on(table.heartbeatId, table.receivedAt),
  })
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id").references(() => monitors.id, {
      onDelete: "cascade",
    }),
    heartbeatId: uuid("heartbeat_id").references(() => heartbeatMonitors.id, {
      onDelete: "cascade",
    }),
    type: alertTypeEnum("type").notNull(),
    channel: alertChannelEnum("channel").notNull(),
    status: alertStatusEnum("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    sentAt: timestamp("sent_at"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdCreatedAtIdx: index("alerts_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    statusIdx: index("alerts_status_idx").on(table.status),
  })
);

export const alertSettings = pgTable("alert_settings", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  slackWebhookUrl: varchar("slack_webhook_url", { length: 2048 }),
  slackVerified: boolean("slack_verified").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type Monitor = typeof monitors.$inferSelect;
export type MonitorEvent = typeof monitorEvents.$inferSelect;
export type HeartbeatMonitor = typeof heartbeatMonitors.$inferSelect;
export type HeartbeatPing = typeof heartbeatPings.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type AlertSettings = typeof alertSettings.$inferSelect;

