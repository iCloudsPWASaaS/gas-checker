import { handleRoute, ok, parseBody, requireAccount } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { account } = await requireAccount(request);
    return ok(account.profile);
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const { ctx } = await requireAccount(request);
    const input = profileUpdateSchema.parse(await parseBody(request));
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) patch[key] = value;
    }

    const { data, error } = await ctx.admin
      .from("profiles")
      .update(patch)
      .eq("id", ctx.user.id)
      .select("*")
      .single();
    if (error) throw error;
    return ok(data);
  });
}
