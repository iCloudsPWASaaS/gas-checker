import { handleRoute, ok, parseBody, requireAccount } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { account } = await requireAccount(request);
    return ok(account.settings);
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const { ctx } = await requireAccount(request);
    const input = settingsSchema.parse(await parseBody(request));
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) patch[key] = value;
    }

    const { data: existing } = await ctx.admin
      .from("settings")
      .select("user_id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await ctx.admin
        .from("settings")
        .insert({ ...patch, user_id: ctx.user.id })
        .select("*")
        .single();
      if (error) throw error;
      return ok(data);
    }

    const { data, error } = await ctx.admin
      .from("settings")
      .update(patch)
      .eq("user_id", ctx.user.id)
      .select("*")
      .single();
    if (error) throw error;
    return ok(data);
  });
}
