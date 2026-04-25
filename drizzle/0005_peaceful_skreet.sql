ALTER TABLE "items" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "parent_item_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "season_number" integer;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "season_count" integer;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_parent_item_id_items_id_fk" FOREIGN KEY ("parent_item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;