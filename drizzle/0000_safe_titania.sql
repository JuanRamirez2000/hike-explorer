CREATE TYPE "public"."fog_status" AS ENUM('pending', 'processing', 'complete', 'error');--> statement-breakpoint
CREATE TABLE "hikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"date" date,
	"bbox" real[4],
	"stats" jsonb,
	"fog_status" "fog_status" DEFAULT 'pending',
	"fog_geojson" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fog_status_check" CHECK ("hikes"."fog_status" in ('pending', 'processing', 'complete', 'error'))
);
--> statement-breakpoint
CREATE TABLE "track_points" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"hike_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"elevation" double precision NOT NULL,
	"timestamp" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"viz_preferences" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "hikes" ADD CONSTRAINT "hikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_points" ADD CONSTRAINT "track_points_hike_id_hikes_id_fk" FOREIGN KEY ("hike_id") REFERENCES "public"."hikes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;