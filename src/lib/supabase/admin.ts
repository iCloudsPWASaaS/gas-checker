import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export type AdminClient = ReturnType<typeof createAdminClient>;

export function createAdminClient() {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: env.schema,
    },
  });
}
