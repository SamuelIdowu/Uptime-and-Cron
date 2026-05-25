ALTER TYPE "alert_channel" ADD VALUE 'telegram';--> statement-breakpoint
ALTER TABLE "alert_settings" ADD COLUMN "telegram_chat_id" varchar(255);