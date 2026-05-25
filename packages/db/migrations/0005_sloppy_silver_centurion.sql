CREATE TABLE IF NOT EXISTS "monitor_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"status" "monitor_status" NOT NULL,
	"http_status" integer,
	"response_ms" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitor_checks" ADD CONSTRAINT "monitor_checks_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitor_checks_monitor_id_created_at_idx" ON "monitor_checks" ("monitor_id","created_at");