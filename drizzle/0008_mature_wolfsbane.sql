CREATE INDEX "friendships_requester_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "guild_members_user_idx" ON "guild_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "items_user_hobby_idx" ON "items" USING btree ("user_id","hobby_id");--> statement-breakpoint
CREATE INDEX "items_parent_idx" ON "items" USING btree ("parent_item_id");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");