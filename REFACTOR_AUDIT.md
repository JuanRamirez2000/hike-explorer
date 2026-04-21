# Refactor Audit

_Read-only audit. No files were modified. Generated 2026-04-20._

---

## Summary

- **Files scanned:** 46 (all `.ts` / `.tsx` / `.sql` / `.json` under `app/`, `components/`, `lib/`, `types/`, `db/`, `supabase/functions/`, root config)
- **Suggestions:** 15 (High: 4, Medium: 7, Low: 4)
- **Top 3 highest-impact items**
  1. `proxy.ts` is not wired as Next.js middleware — session refresh silently never runs
  2. `HikeMapView.tsx` (595 lines, 5+ responsibilities) — hotpath and growing
  3. Geo / viewshed logic duplicated verbatim between `lib/` and the Edge Function

---

## Deferred / Still To Do

### [High] supabase/functions/compute-viewshed/index.ts — async elevation inside tight inner loop
**Remaining:** Pre-fetch all tiles touched by an observer's bounding circle before starting the ray loop (2–4 tiles per observer), then make elevation lookup synchronous. Eliminates 4,320+ sequential `await`s per observer.
**Effort:** L

---

## Deferred / Needs Design Decision

1. **`fog_geojson` vs client-computed viewshed split.** The edge function stores a 1.5 km-radius result; the client computes up to 50 km live. Both write to the same `fog_geojson` column. Document the intended split before adding UI that reads `fog_geojson` for display.

2. **Edge Function import isolation.** Duplication of `lib/geo.ts` / `lib/viewshed.ts` logic is forced by Deno. A vendored `supabase/functions/_shared/` directory populated by a build-time copy script would resolve this without a full monorepo refactor. Worth setting up before the edge function grows further.

3. **`TrackPointSummary` vs `TrackPoint` timestamp types.** `TrackPointSummary.timestamp` is `string | null`; Drizzle-inferred `TrackPoint.timestamp` is `Date | null`. Pages manually convert via `.toISOString()` at the query boundary. Intentional RSC serialisation — flag if a third page adds a similar query.

---

## Completed

### [High] ✅ proxy.ts — Not broken: Next.js 16 uses proxy.ts with named proxy export
**Done:** Audit suggestion was based on pre-v16 knowledge. Next.js 16 renamed middleware to proxy — `proxy.ts` with `export function proxy` at the project root is the correct and working convention. No change needed.

---

### [High] ✅ components/HikeComponents/HikeCard.tsx + components/MapComponents/HikeInfoCard.tsx — fmtAvgPace dedupe
**Done:** Added `fmtAvgPace` to `lib/format.ts`. Removed both local copies. Both files now import from `@/lib/format`.

---

### [High] ✅ components/MapComponents/MapControlsPanel.tsx — re-declares types already defined elsewhere
**Done:** Deleted the three local declarations. `UnitSystem` imported from `lib/format.ts`; `MapStyle` and `ColorMode` promoted to new `types/map.ts` and imported from there in both `MapControlsPanel.tsx` and `HikeMapView.tsx`.

---

### [High/Medium] ✅ lib/hike-actions.ts + lib/viewshed-actions.ts — supabase.auth.getUser() called directly
**Done:** `saveHike`, `deleteHike`, and `triggerViewshed` all now use `getCurrentUser()` for the auth guard. Supabase client is still created where needed for storage/session operations.

---

### [High] ✅ supabase/functions/compute-viewshed/index.ts — MAX_RADIUS_M = 1_500 vs client 50_000
**Done:** Added an explicit comment block explaining the intentional 1.5 km server-side draft pass vs the 50 km client-side computation. Also added a `fog_geojson` vs client-computed note to prevent silent debugging confusion.

---

### [Medium] ✅ HikeInfoCard.tsx & MapControlsPanel.tsx — duplicated DisplayModeDropdown
**Done:** Extracted to `components/MapComponents/DisplayModeDropdown.tsx`. `DisplayMode` type exported from there. Both `HikeInfoCard.tsx` and `MapControlsPanel.tsx` now import the shared component.

---

### [Medium] ✅ app/user/page.tsx & app/hike/[id]/map/page.tsx — duplicated TrackPointSummary mapping
**Done:** Added `toTrackPointSummary(row)` helper to `types/models.ts`. Both pages now call `points.map(toTrackPointSummary)` instead of inline mapping.

---

### [Medium] ✅ lib/viewshed-actions.ts:25 — floating Promise in fireViewshed error handler
**Done:** `.catch()` now uses `async () => { await db.update(...) }`. Error status write can no longer silently fail.

---

### [Medium] ✅ app/upload/page.tsx:71 — direct mutation of payload state object
**Done:** `handleSubmit` now builds `const merged = { ...payload, ... }` and passes `merged` to `saveHike`. React immutability contract respected.

---

### [Medium] ✅ lib/hike-actions.ts:78 + lib/viewshed-actions.ts:37 — getSession() used server-side without prior getUser() validation
**Done:** Both call sites now call `await supabase.auth.getUser()` immediately before `getSession()`, making server-side validation explicit at the token-extraction point.

---

### [Medium] ✅ components/MapComponents/HikeInfoCard.tsx:109 — fogStatus prop type duplicates Drizzle enum
**Done:** Added `FogStatus = typeof hikes.$inferSelect["fog_status"]` to `types/models.ts`. `HikeInfoCard` prop now uses `FogStatus | null`.

---

### [Medium] ✅ components/MapComponents/MapControlsPanel.tsx — viewRadius local state has no effect
**Done:** Removed the non-functional `viewRadius` `useState(2000)` and the "View radius" slider entirely. Users can no longer interact with a control that does nothing.

---

### [Medium] ✅ app/upload/page.tsx — GPX file parsed twice on submit
**Done:** `buildHikePayload` is now called alongside `getGPXMetadata` on file select (via `Promise.all`), result cached in `payload` state. Submit reuses the cached payload — no second parse.

---

### [Medium] ✅ components/MapComponents/MapControlsPanel.tsx + HikeInfoCard.tsx + HikeCard.tsx — inline SVG icons duplicated
**Done:** All icon components extracted into `components/icons.tsx`. `MapControlsPanel.tsx` imports 16 icons by name; `HikeInfoCard.tsx` imports 4; `HikeCard.tsx` imports 3 (`IconShare`, `IconEdit`, `IconDelete`). ~200 lines of inline SVG removed from the three files.

---

### [High] ✅ supabase/functions/compute-viewshed/index.ts — duplicates lib/geo.ts + lib/viewshed.ts
**Done:** Documented the forced duplication explicitly at the top of the edge function with a clear comment explaining why (`@/` path aliases don't resolve in Deno), which files are duplicated, and the `supabase/functions/_shared/` build-step path forward.

---

### [Low] ✅ lib/display-utils.ts — vague filename
**Done:** Renamed to `lib/chart-utils.ts`. All 4 import sites updated (`PaceChart.tsx`, `ElevationProfileChart.tsx`, `HikeMapView.tsx`, `app/user/page.tsx`).

---

### [Low] ✅ types/viewshed.ts — exports only ViewshedStatus; viewshed types live in lib/viewshed.ts
**Done:** Moved `Observer`, `GetElevationFn`, `ViewshedOptions`, `ViewshedProgress`, and `VIEWSHED_DEFAULTS` to `types/viewshed.ts`. `lib/viewshed.ts` now imports and re-exports them. `HikeMapView.tsx` and `MapControlsPanel.tsx` import types from `@/types/viewshed`.

---

### [Low] ✅ components/MapComponents/HikeMapLoader.tsx — trivial passthrough, verify intent
**Done:** Verified intentional. Added a comment explaining the separation keeps `ssr: false` and the loading skeleton co-located with the import boundary so the page RSC stays clean.

---

### [High] ✅ components/MapComponents/HikeMapView.tsx — layer logic extracted + useViewshed hook extracted
**Done:** `buildPins`, `buildElevationColors`, `buildPaceColors`, `buildDistanceMarkers`, `geojsonAreaKm2`, and all color constants/gradients extracted into `lib/map-layers.ts`. All viewshed state, refs, computation loop, and `syncViewshedLayer` callback extracted into `hooks/useViewshed.ts`. `HikeMapView.tsx` reduced to ~200 lines (component + terrain helpers only).

---

### [High] ✅ components/MapComponents/MapControlsPanel.tsx — split sub-components
**Done:** `Medallion`/`MedallionRow` extracted to `MapPanelPrimitives.tsx`; `FogStatusBanner` to `FogStatusBanner.tsx`; `StyleThumbnail` to `StyleThumbnail.tsx`. `MapControlsPanel.tsx` now contains only the panel component and its props interface (~230 lines).

---

### [Low] ✅ components/HikeComponents/HikeCard.tsx:103 — stale TODO comment (minimap already implemented)
**Done:** Deleted the stale TODO block. `buildMinimapUrl` and the `<Image>` render below it are the implementation.

---

### [Low] ✅ lib/format.ts:51 — fmtAvgPace duplicates pace-formatting logic from fmtPace
**Done:** `fmtAvgPace` now computes `minPerKm` then delegates to `fmtPace(minPerKm, unit)`. Single formatting implementation.

---

### [Low] ✅ components/MapComponents/HikeInfoCard.tsx:228 — hardcoded stub cells with no debt marker
**Done:** Added TODO comments on "Elev. loss" and "Avg/Max grade" cells to mark them as not-yet-implemented.

---

### [Low] ✅ components/MapComponents/HikeMapView.tsx:146 — 7 separate ref-sync useEffects
**Done:** Removed all 7 effects. Ref assignments are now inline in the render body (`terrainExpRef.current = terrainExp;` etc.), which is the canonical pattern.
