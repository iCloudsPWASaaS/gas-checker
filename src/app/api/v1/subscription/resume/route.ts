import { handleRoute, ok, requireAccount } from "@/lib/api";
import { isStripeEnabled } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    const subscription = account.subscription;

    if (!subscription) {
      return ok({ subscription: null, message: "No subscription to resume." });
    }

    if (isStripeEnabled() && subscription.stripe_subscription_id) {
      await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
    }

    const { data } = await ctx.admin
      .from("subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("user_id", ctx.user.id)
      .select("*")
      .maybeSingle();

    return ok({ subscription: data, message: "Subscription resumed." });
  });
}
