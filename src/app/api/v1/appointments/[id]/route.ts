import {
  ApiError,
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { appointmentUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { data, error } = await ctx.admin
      .from("appointments")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Appointment not found.");
    return ok(data);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;
    const input = appointmentUpdateSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("appointments")
      .update(input)
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Appointment not found.");
    return ok(data);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { error } = await ctx.admin.from("appointments").delete().eq("id", id).eq("user_id", ctx.user.id);
    if (error) throw error;
    return ok({ deleted: true, id });
  });
}
