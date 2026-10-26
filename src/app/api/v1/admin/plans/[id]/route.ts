import { ApiError, handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { TRIAL_PLAN_ID } from "@/lib/plans";
import { adminPlanUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const { id } = await params;
    const input = adminPlanUpdateSchema.parse(await parseBody(request));

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      patch[key] = (value === "" && key.startsWith("stripe_")) ? null : value;
    }
    if (Object.keys(patch).length === 0) {
      throw new ApiError(422, "NO_CHANGES", "Provide at least one field to update.");
    }
    if (id === TRIAL_PLAN_ID && patch.is_active === false) {
      throw new ApiError(409, "TRIAL_PLAN_PROTECTED", "The trial plan must stay active for new signups.");
    }

    const { data: existing } = await ctx.admin.from("plans").select("id").eq("id", id).maybeSingle();
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Plan not found.");

    const { data, error } = await ctx.admin
      .from("plans")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    await logAdminAction(ctx.admin, ctx.email, "plan.update", "plan", id, patch);

    return ok(data);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  void request;
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const { id } = await params;

    if (id === TRIAL_PLAN_ID) {
      throw new ApiError(409, "TRIAL_PLAN_PROTECTED", "The trial plan cannot be deleted.");
    }

    const { count } = await ctx.admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", id);

    if ((count || 0) > 0) {
      throw new ApiError(
        409,
        "PLAN_IN_USE",
        "This plan is assigned to subscriptions. Deactivate it instead of deleting it.",
      );
    }

    const { data, error } = await ctx.admin.from("plans").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Plan not found.");

    await logAdminAction(ctx.admin, ctx.email, "plan.delete", "plan", id, {});

    return ok({ deleted: true, id });
  });
}
