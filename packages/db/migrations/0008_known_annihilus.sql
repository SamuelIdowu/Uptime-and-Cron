DO $$ BEGIN
 CREATE TYPE "public"."ssl_policy" AS ENUM('strict', 'standard', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heartbeat_daily_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"heartbeat_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"uptime_percentage" numeric(5, 2) NOT NULL,
	"total_pings" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "auto_retry" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "ssl_policy" "ssl_policy" DEFAULT 'strict' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heartbeat_daily_aggregates" ADD CONSTRAINT "heartbeat_daily_aggregates_heartbeat_id_heartbeat_monitors_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat_monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heartbeat_daily_aggregates_heartbeat_id_date_idx" ON "heartbeat_daily_aggregates" ("heartbeat_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "heartbeat_daily_aggregates_heartbeat_id_date_unique" ON "heartbeat_daily_aggregates" ("heartbeat_id","date");