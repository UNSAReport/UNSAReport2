ALTER TABLE "presentation_versions" ADD COLUMN "bundle_s3_prefix" text;--> statement-breakpoint
ALTER TABLE "presentation_versions" ADD COLUMN "bundle_size_bytes" integer;--> statement-breakpoint
ALTER TABLE "presentation_versions" ADD COLUMN "build_hash" varchar(64);