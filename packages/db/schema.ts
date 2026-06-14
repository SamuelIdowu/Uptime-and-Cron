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
  uniqueIndex,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";

// ... (keep existing enums)

// Enums
export const planEnum = pgEnum("plan", ["free", "paid"]);
export const monitorStatusEnum = pgEnum("monitor_status", [
  "up",
  "down",
  "paused",
  "pending",
]);
export const sslPolicyEnum = pgEnum("ssl_policy", [
  "strict",
  "standard",
  "none",
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
export const alertChannelEnum = pgEnum("alert_channel", ["email", "slack", "telegram"]);
export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "sent",
  "failed",
  "dead",
]);
export const eventStatusEnum = pgEnum("event_status", ["down", "up"]);
export const healthThresholdEnum = pgEnum("health_threshold", [
  "any",
  "all",
  "quorum",
]);
export const teamRoleEnum = pgEnum("team_role", ["admin", "viewer"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]);

// Tables
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  appUrl: varchar("app_url", { length: 2048 }),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const environments = pgTable("environments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  baseUrl: varchar("base_url", { length: 2048 }).notNull(),
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
    url: varchar("url", { length: 2048 }),
    intervalMinutes: integer("interval_minutes").notNull().default(5),
    expectedStatus: integer("expected_status").notNull().default(200),
    status: monitorStatusEnum("status").notNull().default("pending"),
    healthThreshold: healthThresholdEnum("health_threshold").notNull().default("any"),
    lastCheckedAt: timestamp("last_checked_at"),
    lastStatusChangeAt: timestamp("last_status_change_at"),
    uptime7d: decimal("uptime_7d", { precision: 5, scale: 2 }),
    uptime30d: decimal("uptime_30d", { precision: 5, scale: 2 }),
    avgResponseMs: integer("avg_response_ms"),
    autoRetry: integer("auto_retry").notNull().default(3),
    sslPolicy: sslPolicyEnum("ssl_policy").notNull().default("strict"),
    paused: boolean("paused").notNull().default(false),
    sslExpiryAt: timestamp("ssl_expiry_at"),
    assertions: text("assertions"),
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

export const monitorTargets = pgTable("monitor_targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 2048 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const monitorEvents = pgTable(
  "monitor_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    status: eventStatusEnum("status").notNull(),
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
    uptime7d: decimal("uptime_7d", { precision: 5, scale: 2 }),
    uptime30d: decimal("uptime_30d", { precision: 5, scale: 2 }),
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
    durationMs: integer("duration_ms"),
    exitCode: integer("exit_code"),
    log: text("log"),
  },
  (table) => ({
    heartbeatIdReceivedAtIdx: index(
      "heartbeat_pings_heartbeat_id_received_at_idx"
    ).on(table.heartbeatId, table.receivedAt),
  })
);

export const heartbeatDailyAggregates = pgTable(
  "heartbeat_daily_aggregates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    heartbeatId: uuid("heartbeat_id")
      .notNull()
      .references(() => heartbeatMonitors.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }).notNull(),
    totalPings: integer("total_pings").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    heartbeatIdDateIdx: index("heartbeat_daily_aggregates_heartbeat_id_date_idx").on(
      table.heartbeatId,
      table.date
    ),
    heartbeatIdDateUnique: uniqueIndex("heartbeat_daily_aggregates_heartbeat_id_date_unique").on(
      table.heartbeatId,
      table.date
    ),
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

export const monitorChecks = pgTable(
  "monitor_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    status: monitorStatusEnum("status").notNull(),
    httpStatus: integer("http_status"),
    responseMs: integer("response_ms"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    monitorIdCreatedAtIdx: index("monitor_checks_monitor_id_created_at_idx").on(
      table.monitorId,
      table.createdAt
    ),
  })
);

export const monitorDailyAggregates = pgTable(
  "monitor_daily_aggregates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    avgResponseMs: integer("avg_response_ms").notNull(),
    uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }).notNull(),
    totalChecks: integer("total_checks").notNull(),
    failedChecks: integer("failed_checks").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    monitorIdDateIdx: index("monitor_daily_aggregates_monitor_id_date_idx").on(
      table.monitorId,
      table.date
    ),
    monitorIdDateUnique: uniqueIndex("monitor_daily_aggregates_monitor_id_date_unique").on(
      table.monitorId,
      table.date
    ),
  })
);

export const alertSettings = pgTable("alert_settings", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  slackWebhookUrl: varchar("slack_webhook_url", { length: 2048 }),
  slackVerified: boolean("slack_verified").notNull().default(false),
  telegramChatId: varchar("telegram_chat_id", { length: 255 }),
  telegramBotToken: varchar("telegram_bot_token", { length: 255 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const statusPages = pgTable(
  "status_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    logoUrl: varchar("logo_url", { length: 2048 }),
    themeConfig: jsonb("theme_config"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("status_pages_user_id_idx").on(table.userId),
    slugIdx: uniqueIndex("status_pages_slug_idx").on(table.slug),
  })
);

export const statusPageMonitors = pgTable(
  "status_page_monitors",
  {
    statusPageId: uuid("status_page_id")
      .notNull()
      .references(() => statusPages.id, { onDelete: "cascade" }),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.statusPageId, table.monitorId] }),
  })
);

export const maintenanceWindows = pgTable(
  "maintenance_windows",
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
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("maintenance_windows_user_id_idx").on(table.userId),
    monitorIdIdx: index("maintenance_windows_monitor_id_idx").on(table.monitorId),
    heartbeatIdIdx: index("maintenance_windows_heartbeat_id_idx").on(table.heartbeatId),
    timeRangeIdx: index("maintenance_windows_time_range_idx").on(
      table.startTime,
      table.endTime
    ),
  })
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("team_members_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("team_members_user_id_idx").on(table.userId),
    workspaceUserUnique: uniqueIndex("team_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId
    ),
  })
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: varchar("workspace_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: teamRoleEnum("role").notNull().default("viewer"),
    token: varchar("token", { length: 255 }).notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    invitedBy: varchar("invited_by", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("invitations_workspace_id_idx").on(table.workspaceId),
    tokenIdx: uniqueIndex("invitations_token_idx").on(table.token),
    emailWorkspaceUnique: uniqueIndex("invitations_email_workspace_unique").on(
      table.email,
      table.workspaceId
    ),
  })
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, { onDelete: "cascade" }),
    status: incidentStatusEnum("status").notNull().default("investigating"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    monitorIdIdx: index("incidents_monitor_id_idx").on(table.monitorId),
    statusIdx: index("incidents_status_idx").on(table.status),
  })
);

export const incidentEvents = pgTable(
  "incident_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, { onDelete: "cascade" }),
    status: incidentStatusEnum("status").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    incidentIdIdx: index("incident_events_incident_id_idx").on(table.incidentId),
  })
);

import { relations } from "drizzle-orm";

// ... (keep existing enums and tables)

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  monitors: many(monitors),
  heartbeatMonitors: many(heartbeatMonitors),
  statusPages: many(statusPages),
  maintenanceWindows: many(maintenanceWindows),
  alerts: many(alerts),
  environments: many(environments),
  teamMemberships: many(teamMembers, { relationName: "user_memberships" }),
  workspaceMembers: many(teamMembers, { relationName: "workspace_members" }),
  sentInvitations: many(invitations, { relationName: "sent_invitations" }),
  workspaceInvitations: many(invitations, { relationName: "workspace_invitations" }),
  alertSettings: one(alertSettings, {
    fields: [users.id],
    references: [alertSettings.userId],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  workspace: one(users, {
    fields: [teamMembers.workspaceId],
    references: [users.id],
    relationName: "workspace_members",
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
    relationName: "user_memberships",
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspace: one(users, {
    fields: [invitations.workspaceId],
    references: [users.id],
    relationName: "workspace_invitations",
  }),
  inviter: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
    relationName: "sent_invitations",
  }),
}));

export const maintenanceWindowsRelations = relations(maintenanceWindows, ({ one }) => ({
  user: one(users, {
    fields: [maintenanceWindows.userId],
    references: [users.id],
  }),
  monitor: one(monitors, {
    fields: [maintenanceWindows.monitorId],
    references: [monitors.id],
  }),
  heartbeat: one(heartbeatMonitors, {
    fields: [maintenanceWindows.heartbeatId],
    references: [heartbeatMonitors.id],
  }),
}));

export const statusPagesRelations = relations(statusPages, ({ one, many }) => ({
  user: one(users, {
    fields: [statusPages.userId],
    references: [users.id],
  }),
  monitors: many(statusPageMonitors),
}));

export const statusPageMonitorsRelations = relations(statusPageMonitors, ({ one }) => ({
  statusPage: one(statusPages, {
    fields: [statusPageMonitors.statusPageId],
    references: [statusPages.id],
  }),
  monitor: one(monitors, {
    fields: [statusPageMonitors.monitorId],
    references: [monitors.id],
  }),
}));

export const environmentsRelations = relations(environments, ({ one }) => ({
  user: one(users, {
    fields: [environments.userId],
    references: [users.id],
  }),
}));

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  user: one(users, {
    fields: [monitors.userId],
    references: [users.id],
  }),
  events: many(monitorEvents),
  checks: many(monitorChecks),
  dailyAggregates: many(monitorDailyAggregates),
  alerts: many(alerts),
  targets: many(monitorTargets),
  maintenanceWindows: many(maintenanceWindows),
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  monitor: one(monitors, {
    fields: [incidents.monitorId],
    references: [monitors.id],
  }),
  events: many(incidentEvents),
}));

export const incidentEventsRelations = relations(incidentEvents, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentEvents.incidentId],
    references: [incidents.id],
  }),
}));

export const monitorTargetsRelations = relations(monitorTargets, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorTargets.monitorId],
    references: [monitors.id],
  }),
}));

export const monitorDailyAggregatesRelations = relations(monitorDailyAggregates, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorDailyAggregates.monitorId],
    references: [monitors.id],
  }),
}));

export const monitorChecksRelations = relations(monitorChecks, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorChecks.monitorId],
    references: [monitors.id],
  }),
}));

export const monitorEventsRelations = relations(monitorEvents, ({ one }) => ({
  monitor: one(monitors, {
    fields: [monitorEvents.monitorId],
    references: [monitors.id],
  }),
}));

export const heartbeatMonitorsRelations = relations(heartbeatMonitors, ({ one, many }) => ({
  user: one(users, {
    fields: [heartbeatMonitors.userId],
    references: [users.id],
  }),
  pings: many(heartbeatPings),
  dailyAggregates: many(heartbeatDailyAggregates),
  alerts: many(alerts),
  maintenanceWindows: many(maintenanceWindows),
}));


export const heartbeatDailyAggregatesRelations = relations(heartbeatDailyAggregates, ({ one }) => ({
  heartbeat: one(heartbeatMonitors, {
    fields: [heartbeatDailyAggregates.heartbeatId],
    references: [heartbeatMonitors.id],
  }),
}));

export const heartbeatPingsRelations = relations(heartbeatPings, ({ one }) => ({
  heartbeat: one(heartbeatMonitors, {
    fields: [heartbeatPings.heartbeatId],
    references: [heartbeatMonitors.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  monitor: one(monitors, {
    fields: [alerts.monitorId],
    references: [monitors.id],
  }),
  heartbeat: one(heartbeatMonitors, {
    fields: [alerts.heartbeatId],
    references: [heartbeatMonitors.id],
  }),
}));

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
  user: one(users, {
    fields: [alertSettings.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type Monitor = typeof monitors.$inferSelect;
export type MonitorEvent = typeof monitorEvents.$inferSelect;
export type MonitorCheck = typeof monitorChecks.$inferSelect;
export type MonitorDailyAggregate = typeof monitorDailyAggregates.$inferSelect;
export type HeartbeatDailyAggregate = typeof heartbeatDailyAggregates.$inferSelect;
export type HeartbeatMonitor = typeof heartbeatMonitors.$inferSelect;
export type HeartbeatPing = typeof heartbeatPings.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type AlertSettings = typeof alertSettings.$inferSelect;
export type Environment = typeof environments.$inferSelect;
export type MonitorTarget = typeof monitorTargets.$inferSelect;
export type StatusPage = typeof statusPages.$inferSelect;
export type StatusPageMonitor = typeof statusPageMonitors.$inferSelect;
export type MaintenanceWindow = typeof maintenanceWindows.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type IncidentEvent = typeof incidentEvents.$inferSelect;

