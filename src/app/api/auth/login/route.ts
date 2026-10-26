import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleRoute, ok, parseBody } from "@/lib/api";
import { publicUser, safeGetAccount } from "@/lib/auth-service";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const input = loginSchema.parse(await parseBody(request));
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error || !data.user) throw error || new Error("Sign in failed");

    const { account, warning } = await safeGetAccount(data.user, createAdminClient());

    return ok({
      user: publicUser(data.user),
      account,
      warning: warning || null,
    });
  });
}
