ALTER TABLE "elearning_items" ALTER COLUMN "due_at" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "repeat" varchar(10) DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_logs_habit_id_date_uidx" ON "habit_logs" USING btree ("habit_id","date");