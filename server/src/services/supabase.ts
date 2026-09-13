/* SOS — SafeOrbitForSattelites · Supabase client singleton
 *
 * Initialises the Supabase JS client once and exports it for use across the
 * backend (e.g. Storage asset fetching, database queries).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
