import { ApiError, handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { adminSubscriptionSchema } from "@/lib/validation";

function periodEnd(start: Date, interval: "monthly" | "yearly") {
  const end = new Date(start);
  if (interval === "monthly") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const input = adminSubscriptionSchema.parse(await parseBody(request));

    const { data: plan } = await ctx.admin
      .from("plans")
      .select("id,name")
      .eq("id", input.plan_id)
      .maybeSingle();
    if (!plan) throw new ApiError(404, "PLAN_NOT_FOUND", "Choose an existing plan.");

    const { data: existing } = await ctx.admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", input.user_id)
      .maybeSingle();
    if (existing) {
      throw new ApiError(409, "SUBSCRIPTION_EXISTS", "This user already has a subscription.");
    }

    const platform = await getPlatformSettings(ctx.admin);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + platform.trial_days * 86400000);
    const isTrialing = input.status === "trialing";
    const isActive = input.status === "active";

    const { data, error } = await ctx.admin
      .from("subscriptions")
      .insert({
        user_id: input.user_id,
        plan_id: input.plan_id,
        status: input.status,
        billing_interval: input.billing_interval,
        trial_start: input.trial_start || (isTrialing ? now.toISOString() : null),
        trial_end: input.trial_end || (isTrialing ? trialEnd.toISOString() : null),
        current_period_start: input.current_period_start || now.toISOString(),
        current_period_end:
          input.current_period_end ||
          (isActive
            ? periodEnd(now, input.billing_interval).toISOString()
            : isTrialing
              ? trialEnd.toISOString()
              : null),
        cancel_at_period_end: input.cancel_at_period_end,
        stripe_customer_id: input.stripe_customer_id || null,
        stripe_subscription_id: input.stripe_subscription_id || null,
      })
      .select("*")
      .single();
    if (error) throw error;

    await logAdminAction(ctx.admin, ctx.email, "subscription.create", "subscription", data.id, {
      user_id: input.user_id,
      plan_id: input.plan_id,
      status: input.status,
    });

    return ok(data, undefined, { status: 201 });
  });
}
