import { createClient } from "@supabase/supabase-js";

let cachedSupabase = null as ReturnType<typeof createClient> | null;

export function getSupabase() {
  if (cachedSupabase) {
    return cachedSupabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  cachedSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedSupabase;
}
