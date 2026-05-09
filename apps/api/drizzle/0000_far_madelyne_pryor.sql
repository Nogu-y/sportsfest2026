CREATE TYPE "public"."block_type" AS ENUM('LEAGUE', 'TOURNAMENT', 'CUMULATIVE', 'SINGLE');--> statement-breakpoint
CREATE TYPE "public"."event_format" AS ENUM('TOURNAMENT', 'LEAGUE_TO_TOURNAMENT', 'HEATS_AND_FINAL');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('Waiting', 'Preparing', 'Playing', 'Finished', 'Completed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."ranking_order" AS ENUM('ASC', 'DESC');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('FINAL', 'THIRD_PLACE', 'SEMIFINAL', 'QUARTERFINAL', 'ROUND_2', 'ROUND_1', 'QUALIFIER', 'CONSOLATION');--> statement-breakpoint
CREATE TABLE "block_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_block_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"points" integer NOT NULL,
	"note" text,
	CONSTRAINT "block_team_unique" UNIQUE("event_block_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "event_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "block_type" NOT NULL,
	"stage" "stage" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"rule_md" text,
	"ranking_order" "ranking_order" NOT NULL,
	"format" "event_format" NOT NULL,
	"point_allocation" jsonb NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"map_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"x_ratio" integer NOT NULL,
	"y_ratio" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_path" varchar(255) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_plan_id" integer NOT NULL,
	"team_id" integer,
	"prereq_match_id" integer,
	"prereq_block_id" integer,
	"prereq_rank" integer,
	"score" integer,
	"rank" integer,
	"is_disqualified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_block_id" integer NOT NULL,
	"location_id" integer,
	"name" varchar(100),
	"description" text,
	"stage" "stage" NOT NULL,
	"status" "match_status" DEFAULT 'Waiting' NOT NULL,
	"scheduled_start_time" timestamp with time zone NOT NULL,
	"scheduled_end_time" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"points" integer NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "system_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"day1" timestamp with time zone NOT NULL,
	"day2" timestamp with time zone NOT NULL,
	"master_version" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" varchar(255) NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"expiration" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_subscription_id" integer NOT NULL,
	"match_plan_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_unique" UNIQUE("user_subscription_id","match_plan_id")
);
--> statement-breakpoint
ALTER TABLE "block_rankings" ADD CONSTRAINT "block_rankings_event_block_id_event_blocks_id_fk" FOREIGN KEY ("event_block_id") REFERENCES "public"."event_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_rankings" ADD CONSTRAINT "block_rankings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_blocks" ADD CONSTRAINT "event_blocks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_plan_id_match_plans_id_fk" FOREIGN KEY ("match_plan_id") REFERENCES "public"."match_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_prereq_match_id_match_plans_id_fk" FOREIGN KEY ("prereq_match_id") REFERENCES "public"."match_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_prereq_block_id_event_blocks_id_fk" FOREIGN KEY ("prereq_block_id") REFERENCES "public"."event_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_plans" ADD CONSTRAINT "match_plans_event_block_id_event_blocks_id_fk" FOREIGN KEY ("event_block_id") REFERENCES "public"."event_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_plans" ADD CONSTRAINT "match_plans_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("user_subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_match_plan_id_match_plans_id_fk" FOREIGN KEY ("match_plan_id") REFERENCES "public"."match_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_blocks_event_idx" ON "event_blocks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "locations_map_idx" ON "locations" USING btree ("map_id");--> statement-breakpoint
CREATE INDEX "participants_match_idx" ON "match_participants" USING btree ("match_plan_id");--> statement-breakpoint
CREATE INDEX "match_plans_block_idx" ON "match_plans" USING btree ("event_block_id");--> statement-breakpoint
CREATE INDEX "match_plans_status_idx" ON "match_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "match_plans_start_idx" ON "match_plans" USING btree ("scheduled_start_time");--> statement-breakpoint
CREATE INDEX "scores_team_idx" ON "scores" USING btree ("team_id");