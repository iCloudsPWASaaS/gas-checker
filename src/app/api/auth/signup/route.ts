import { handleRoute, ok, parseBody } from "@/lib/api";
import { createAccount, publicUser } from "@/lib/auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const input = signupSchema.parse(await parseBody(request));
    const created = await createAccount(input);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw error;

    return ok({
      user: publicUser(created.user),
      account: created.account,
      warning: created.warning || null,
    });
  });
}
