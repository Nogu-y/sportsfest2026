CREATE TYPE "public"."staff_role" AS ENUM('ADMIN', 'STAFF');--> statement-breakpoint
CREATE TABLE "staff_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"login_id" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"role" "staff_role" NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_accounts_login_id_unique" UNIQUE("login_id")
);
--> statement-breakpoint
CREATE TABLE "staff_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_account_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_account_id_staff_accounts_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_accounts_role_idx" ON "staff_accounts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_accounts_active_idx" ON "staff_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "staff_sessions_account_idx" ON "staff_sessions" USING btree ("staff_account_id");--> statement-breakpoint
CREATE INDEX "staff_sessions_expires_idx" ON "staff_sessions" USING btree ("expires_at");