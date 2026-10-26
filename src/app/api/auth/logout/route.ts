import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleRoute, ok } from "@/lib/api";

export async function POST() {
  return handleRoute(async () => {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return ok({ success: true });
  });
}
