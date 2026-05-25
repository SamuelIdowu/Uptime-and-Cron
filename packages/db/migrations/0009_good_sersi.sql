ALTER TABLE "heartbeat_monitors" ADD COLUMN "uptime_7d" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "heartbeat_monitors" ADD COLUMN "uptime_30d" numeric(5, 2);