CREATE TABLE IF NOT EXISTS "monitor_daily_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"avg_response_ms" integer NOT NULL,
	"uptime_percentage" numeric(5, 2) NOT NULL,
	"total_checks" integer NOT NULL,
	"failed_checks" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitor_daily_aggregates" ADD CONSTRAINT "monitor_daily_aggregates_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitor_daily_aggregates_monitor_id_date_idx" ON "monitor_daily_aggregates" ("monitor_id","date");