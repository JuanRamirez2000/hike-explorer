ALTER TABLE "track_points" DROP CONSTRAINT "track_points_hike_id_hikes_id_fk";
--> statement-breakpoint
ALTER TABLE "hikes" ADD COLUMN "gpx_storage_path" text;--> statement-breakpoint
ALTER TABLE "track_points" ADD CONSTRAINT "track_points_hike_id_hikes_id_fk" FOREIGN KEY ("hike_id") REFERENCES "public"."hikes"("id") ON DELETE cascade ON UPDATE no action;