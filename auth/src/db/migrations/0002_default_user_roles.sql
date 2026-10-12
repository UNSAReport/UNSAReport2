INSERT INTO "user_roles" ("user_id", "sub_app", "role")
SELECT "id", 'registry', 'user' FROM "users"
ON CONFLICT ("user_id", "sub_app") DO NOTHING;
--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "sub_app", "role")
SELECT "id", 'slides', 'user' FROM "users"
ON CONFLICT ("user_id", "sub_app") DO NOTHING;
