import {
  ApiError,
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { reminderUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;
    const input = reminderUpdateSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("reminders")
      .update(input)
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Reminder not found.");
    return ok(data);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { error } = await ctx.admin.from("reminders").delete().eq("id", id).eq("user_id", ctx.user.id);
    if (error) throw error;
    return ok({ deleted: true, id });
  });
}
