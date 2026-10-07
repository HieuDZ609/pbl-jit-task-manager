CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'preferences'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "preferences" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "checklists" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "elearning_items" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
-- 0000 tạo "key" là inline PRIMARY KEY ⇒ Postgres tự đặt tên constraint là
-- "preferences_pkey". Phải drop trước, nếu không sẽ thành multiple primary keys.
ALTER TABLE "preferences" DROP CONSTRAINT "preferences_pkey";--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_key_user_id_pk" PRIMARY KEY("key","user_id");--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elearning_items" ADD CONSTRAINT "elearning_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklists_user_id_idx" ON "checklists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "elearning_items_user_id_idx" ON "elearning_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "focus_sessions_user_id_idx" ON "focus_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "folders_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habit_logs_user_id_idx" ON "habit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "habits_user_id_idx" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lists_user_id_idx" ON "lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");