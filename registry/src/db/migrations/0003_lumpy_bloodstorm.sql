CREATE TABLE "scope_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_id" uuid NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"checksum" text NOT NULL,
	"s3_key" text NOT NULL,
	CONSTRAINT "unique_scope_file_path" UNIQUE("scope_id","path")
);
--> statement-breakpoint
CREATE TABLE "scope_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scope_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_scope_member" UNIQUE("scope_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "scope_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_name" text NOT NULL,
	"requested_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"scope_type" text NOT NULL,
	"archive_s3_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scopes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "scope_files" ADD CONSTRAINT "scope_files_scope_id_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."scopes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scope_invitations" ADD CONSTRAINT "scope_invitations_scope_id_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."scopes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scope_members" ADD CONSTRAINT "scope_members_scope_id_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "public"."scopes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_scope_files_scope" ON "scope_files" USING btree ("scope_id");--> statement-breakpoint
CREATE INDEX "idx_scope_invitations_scope" ON "scope_invitations" USING btree ("scope_id");--> statement-breakpoint
CREATE INDEX "idx_scope_invitations_email" ON "scope_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_scope_members_user" ON "scope_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scope_requests_status" ON "scope_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scope_requests_user" ON "scope_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_scope_requests_name" ON "scope_requests" USING btree ("scope_name");--> statement-breakpoint
CREATE INDEX "idx_scopes_name" ON "scopes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_scopes_owner" ON "scopes" USING btree ("owner_id");