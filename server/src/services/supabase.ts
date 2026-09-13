/* SOS — SafeOrbitForSattelites · Supabase client singleton
 *
 * Initialises the Supabase JS client once and exports it for use across the
 * backend (e.g. Storage asset fetching, database queries).
 * Safe to import even when env vars are not set.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}
