DO $$ BEGIN
 CREATE TYPE "public"."alert_channel" AS ENUM('email', 'slack');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."alert_status" AS ENUM('pending', 'sent', 'failed', 'dead');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."alert_type" AS ENUM('down', 'up', 'late', 'recovered');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."heartbeat_status" AS ENUM('up', 'late', 'down', 'paused', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."monitor_status" AS ENUM('up', 'down', 'paused', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_status" AS ENUM('down', 'up');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan" AS ENUM('free', 'paid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_settings" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"slack_webhook_url" varchar(2048),
	"slack_verified" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"monitor_id" uuid,
	"heartbeat_id" uuid,
	"type" "alert_type" NOT NULL,
	"channel" "alert_channel" NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heartbeat_monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"ping_token" varchar(64) NOT NULL,
	"period_minutes" integer NOT NULL,
	"grace_minutes" integer DEFAULT 5 NOT NULL,
	"status" "heartbeat_status" DEFAULT 'pending' NOT NULL,
	"last_ping_at" timestamp,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "heartbeat_monitors_ping_token_unique" UNIQUE("ping_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "heartbeat_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"heartbeat_id" uuid NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"source_ip" varchar(45)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitor_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitor_id" uuid NOT NULL,
	"status" "event_status" NOT NULL,
	"http_status" integer,
	"response_ms" integer,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"interval_minutes" integer DEFAULT 5 NOT NULL,
	"expected_status" integer DEFAULT 200 NOT NULL,
	"status" "monitor_status" DEFAULT 'pending' NOT NULL,
	"last_checked_at" timestamp,
	"last_status_change_at" timestamp,
	"uptime_7d" numeric(5, 2),
	"uptime_30d" numeric(5, 2),
	"avg_response_ms" integer,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255),
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_heartbeat_id_heartbeat_monitors_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat_monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heartbeat_monitors" ADD CONSTRAINT "heartbeat_monitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "heartbeat_pings" ADD CONSTRAINT "heartbeat_pings_heartbeat_id_heartbeat_monitors_id_fk" FOREIGN KEY ("heartbeat_id") REFERENCES "public"."heartbeat_monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitor_events" ADD CONSTRAINT "monitor_events_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monitors" ADD CONSTRAINT "monitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_user_id_created_at_idx" ON "alerts" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_status_idx" ON "alerts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heartbeat_monitors_user_id_idx" ON "heartbeat_monitors" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heartbeat_monitors_ping_token_idx" ON "heartbeat_monitors" ("ping_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heartbeat_monitors_last_ping_idx" ON "heartbeat_monitors" ("last_ping_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "heartbeat_pings_heartbeat_id_received_at_idx" ON "heartbeat_pings" ("heartbeat_id","received_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitor_events_monitor_id_started_at_idx" ON "monitor_events" ("monitor_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitors_user_id_idx" ON "monitors" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monitors_last_checked_idx" ON "monitors" ("last_checked_at");