import { ApiError, handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { adminSubscriptionUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const dateFields = new Set([
  "trial_start",
  "trial_end",
  "current_period_start",
  "current_period_end",
  "stripe_customer_id",
  "stripe_subscription_id",
]);

export async function PATCH(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const { id } = await params;
    const input = adminSubscriptionUpdateSchema.parse(await parseBody(request));

    const { data: existing } = await ctx.admin
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Subscription not found.");

    if (input.plan_id && input.plan_id !== existing.plan_id) {
      const { data: plan } = await ctx.admin
        .from("plans")
        .select("id")
        .eq("id", input.plan_id)
        .maybeSingle();
      if (!plan) throw new ApiError(404, "PLAN_NOT_FOUND", "Choose an existing plan.");
    }

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      patch[key] = dateFields.has(key) && value === "" ? null : value;
    }
    if (Object.keys(patch).length === 0) {
      throw new ApiError(422, "NO_CHANGES", "Provide at least one field to update.");
    }

    const { data, error } = await ctx.admin
      .from("subscriptions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    await logAdminAction(ctx.admin, ctx.email, "subscription.update", "subscription", id, {
      user_id: existing.user_id,
      patch,
    });

    return ok(data);
  });
}
