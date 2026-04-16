import { createClient } from "@/utils/server";
import { cookies } from "next/headers";

/**
 * Returns the currently authenticated Supabase user, or null if not signed in.
 * Safe to call from Server Components and Server Actions.
 * Do NOT put "use server" on this file — that would expose it as an HTTP endpoint.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
