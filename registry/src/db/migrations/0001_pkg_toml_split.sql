ALTER TABLE "package_files" ADD COLUMN "section" text DEFAULT 'components' NOT NULL;--> statement-breakpoint
ALTER TABLE "package_versions" ADD COLUMN "components_s3_key" text;--> statement-breakpoint
ALTER TABLE "package_versions" ADD COLUMN "templates_s3_key" text;