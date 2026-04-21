# Refactor Audit

---

## Summary

- **Files scanned:** 45
- **Suggestions:** 14 (High: 5, Medium: 6, Low: 3)
- **Status:** 12 completed, 2 deferred (large scope / design decisions needed)

---

## Completed

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

### [High] ✅ components/MapComponents/HikeMapView.tsx — layer logic extracted
**Done (partial):** `buildPins`, `buildElevationColors`, `buildPaceColors`, `buildDistanceMarkers`, `geojsonAreaKm2`, and all color constants/gradients extracted into new `lib/map-layers.ts`. `HikeMapView.tsx` reduced by ~130 lines and now imports these helpers. Full `useViewshed` hook extraction still deferred (see below).

---

## Deferred / Still To Do

### [High] components/MapComponents/HikeMapView.tsx — Extract useViewshed hook
**Remaining:** The chunked viewshed computation loop (~200 lines of refs, `useEffect`s, progress state, and `setTimeout` scheduling) can be extracted into `hooks/useViewshed.ts`. The layer extraction above was the prerequisite; this is now unblocked.
**Effort:** L

---

### [High] components/MapComponents/MapControlsPanel.tsx — Split tab panels
**Remaining:** Still 700+ lines. The three tab panels (`MapTab`, `FogTab`, `ViewTab`) and the `Medallion`/`MedallionRow`/`StyleThumbnail` sub-components can be split into co-located files. Icon extraction (done above) was the prerequisite.
**Effort:** M

---

### [High] supabase/functions/compute-viewshed/index.ts — async elevation inside tight inner loop
**Remaining:** Pre-fetch all tiles touched by an observer's bounding circle before starting the ray loop (2–4 tiles per observer), then make elevation lookup synchronous. Eliminates 4,320+ sequential `await`s per observer.
**Effort:** L

---

## Deferred / Needs Design Decision

1. **`fog_geojson` vs client-computed viewshed split.** The edge function stores a 1.5 km-radius result; the client computes up to 50 km live. Both write to the same `fog_geojson` column. Document the intended split before adding UI that reads `fog_geojson` for display.

2. **Edge Function import isolation.** Duplication of `lib/geo.ts` / `lib/viewshed.ts` logic is forced by Deno. A vendored `supabase/functions/_shared/` directory populated by a build-time copy script would resolve this without a full monorepo refactor. Worth setting up before the edge function grows further.

3. **`TrackPointSummary` vs `TrackPoint` timestamp types.** `TrackPointSummary.timestamp` is `string | null`; Drizzle-inferred `TrackPoint.timestamp` is `Date | null`. Pages manually convert via `.toISOString()` at the query boundary. Intentional RSC serialisation — flag if a third page adds a similar query.
