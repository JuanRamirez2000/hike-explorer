import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Enum for the fog-of-war computation lifecycle
export const fogStatusEnum = pgEnum("fog_status", [
  "pending",
  "processing",
  "complete",
  "error",
]);

// Auth stub — keeps the schema auth-ready without requiring a full auth system yet
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// One hike per GPX upload; bbox enables spatial filtering without loading track points
export const hikes = pgTable(
  "hikes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    date: date("date"),
    // [minLng, minLat, maxLng, maxLat] — real(4) matches float4[] in Postgres
    bbox: real("bbox").array(4),
    stats: jsonb("stats"),
    fog_status: fogStatusEnum("fog_status").default("pending"),
    fog_geojson: jsonb("fog_geojson"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "fog_status_check",
      sql`${table.fog_status} in ('pending', 'processing', 'complete', 'error')`
    ),
  ]
);

// Individual rows (not JSONB array) so track points can be streamed during viewshed computation
export const trackPoints = pgTable("track_points", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  hike_id: uuid("hike_id")
    .notNull()
    .references(() => hikes.id),
  seq: integer("seq").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  elevation: doublePrecision("elevation").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }),
});

// Per-user visualisation settings; expands to a full preferences store later
export const userPreferences = pgTable("user_preferences", {
  user_id: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  viz_preferences: jsonb("viz_preferences"),
});
