import { handleRoute, ok, parseBody, requireAccount } from "@/lib/api";
import { deviceTokenSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx } = await requireAccount(request);
    const input = deviceTokenSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("device_tokens")
      .upsert(
        { user_id: ctx.user.id, token: input.token, platform: input.platform },
        { onConflict: "user_id,token" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}

export async function DELETE(request: Request) {
  return handleRoute(async () => {
    const { ctx } = await requireAccount(request);
    const token = new URL(request.url).searchParams.get("token");
    if (token) {
      await ctx.admin.from("device_tokens").delete().eq("user_id", ctx.user.id).eq("token", token);
    }
    return ok({ deleted: true });
  });
}
