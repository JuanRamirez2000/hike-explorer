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

    // ── user-editable metadata ──────────────────────────────────────────────
    // device or app that recorded the GPX (e.g. "Garmin Connect", "Strava")
    creator: text("creator"),

    // ── computed stats from track points ───────────────────────────────────
    // great-circle sum of consecutive track points
    distance_km: doublePrecision("distance_km"),
    // sum of positive elevation deltas
    elevation_gain_m: doublePrecision("elevation_gain_m"),
    // seconds between first and last timestamped track point
    duration_seconds: doublePrecision("duration_seconds"),
    // wall-clock time of the first / last timestamped track point
    start_time: timestamp("start_time", { withTimezone: true }),
    end_time: timestamp("end_time", { withTimezone: true }),

    // ── catch-all for future unstructured metadata ──────────────────────────
    // e.g. historical weather, user notes, terrain tags
    extra: jsonb("extra"),

    // ── fog-of-war ──────────────────────────────────────────────────────────
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
    .references(() => hikes.id, { onDelete: "cascade" }),
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
