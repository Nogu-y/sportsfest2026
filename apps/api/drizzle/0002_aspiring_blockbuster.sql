CREATE TABLE "match_reminder_logs" (
	"match_plan_id" integer NOT NULL,
	"user_subscription_id" integer NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_reminder_unique" UNIQUE("match_plan_id","user_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "match_reminder_logs" ADD CONSTRAINT "match_reminder_logs_match_plan_id_match_plans_id_fk" FOREIGN KEY ("match_plan_id") REFERENCES "public"."match_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_reminder_logs" ADD CONSTRAINT "match_reminder_logs_user_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("user_subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;