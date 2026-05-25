DO $$ BEGIN
 CREATE TYPE "public"."event_status" AS ENUM('down', 'up');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "heartbeat_pings" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "heartbeat_pings" ADD COLUMN "exit_code" integer;--> statement-breakpoint
ALTER TABLE "heartbeat_pings" ADD COLUMN "log" text;--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "ssl_expiry_at" timestamp;--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "assertions" text;