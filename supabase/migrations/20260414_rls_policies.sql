-- ══════════════════════════════════════════════════════════════════════════════
--  Row Level Security policies
--  Applied 2026-04-14 via Supabase MCP.
--  Run this file against your local Supabase instance to mirror production.
--
--  Design notes
--  ─────────────
--  • All tables already have RLS enabled (rowsecurity = true).
--  • The postgres/service-role connection used by Drizzle server actions bypasses
--    RLS entirely — manual ownership checks in those actions are the primary guard.
--  • These policies protect direct Supabase JS client access (anon / authenticated
--    role) and act as a second layer of defence.
--  • Storage bucket "gpx-files" policies are managed separately in the Supabase
--    dashboard (SELECT/INSERT/DELETE/UPDATE already restricted to owner folder).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── users ─────────────────────────────────────────────────────────────────────
-- Read own profile only. Inserts are done server-side via service role.
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ── hikes ─────────────────────────────────────────────────────────────────────
CREATE POLICY "hikes_select_own"
  ON public.hikes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "hikes_insert_own"
  ON public.hikes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hikes_update_own"
  ON public.hikes FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "hikes_delete_own"
  ON public.hikes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── track_points ──────────────────────────────────────────────────────────────
-- Access is gated through ownership of the parent hike.
CREATE POLICY "track_points_select_own"
  ON public.track_points FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hikes
      WHERE hikes.id = track_points.hike_id
        AND hikes.user_id = auth.uid()
    )
  );

CREATE POLICY "track_points_insert_own"
  ON public.track_points FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hikes
      WHERE hikes.id = track_points.hike_id
        AND hikes.user_id = auth.uid()
    )
  );

CREATE POLICY "track_points_delete_own"
  ON public.track_points FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hikes
      WHERE hikes.id = track_points.hike_id
        AND hikes.user_id = auth.uid()
    )
  );

-- ── user_preferences ──────────────────────────────────────────────────────────
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_delete_own"
  ON public.user_preferences FOR DELETE TO authenticated
  USING (user_id = auth.uid());
