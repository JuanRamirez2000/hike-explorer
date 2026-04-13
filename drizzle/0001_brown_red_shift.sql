ALTER TABLE "hikes" ADD COLUMN "creator" text;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "distance_km" double precision;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "elevation_gain_m" double precision;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "duration_seconds" double precision;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "extra" jsonb;--> statement-breakpoint
ALTER TABLE "hikes" DROP COLUMN "stats";