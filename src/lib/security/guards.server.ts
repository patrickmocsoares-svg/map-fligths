/**
 * Server-only authorization helpers.
 *
 * Keeps the "who is allowed to run expensive/privileged jobs" logic in one
 * place so server functions and public hook routes share the same checks.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Throws unless the signed-in caller has the `admin` role. */
export async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Forbidden");
  }
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validates the dedicated server-side secret used by the scheduled
 * discovery hook. Never falls back to the public publishable key.
 */
export function isValidHookSecret(provided: string | null | undefined): boolean {
  const expected = process.env.DISCOVERY_HOOK_SECRET;
  if (!expected || !provided) return false;
  return safeEqual(provided, expected);
}
