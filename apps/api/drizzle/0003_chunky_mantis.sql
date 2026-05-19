CREATE TYPE "public"."day" AS ENUM('day1', 'day2', 'both');--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "day" "day" DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "maps" ADD COLUMN "day" "day" DEFAULT 'both' NOT NULL;