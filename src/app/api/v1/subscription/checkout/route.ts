import { ApiError, handleRoute, ok, parseBody, requireAccount } from "@/lib/api";
import { env, isStripeEnabled } from "@/lib/env";
import { getStripe, priceIdFor } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validation";

export const runtime = "nodejs";

function periodEnd(interval: "monthly" | "yearly") {
  const end = new Date();
  if (interval === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    const input = checkoutSchema.parse(await parseBody(request));

    const { data: planData, error: planError } = await ctx.admin
      .from("plans")
      .select("*")
      .eq("id", input.plan_id)
      .eq("is_active", true)
      .maybeSingle();
    if (planError) throw planError;
    if (!planData) {
      throw new ApiError(404, "PLAN_NOT_FOUND", "That plan is not available.");
    }
    const plan = planData as {
      id: string;
      stripe_price_monthly?: string | null;
      stripe_price_yearly?: string | null;
    };

    if (isStripeEnabled()) {
      const stripe = getStripe();
      let customerId = account.subscription?.stripe_customer_id || null;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name:
            (account.profile?.company_name as string) ||
            (account.profile?.full_name as string) ||
            undefined,
          metadata: { user_id: ctx.user.id },
        });
        customerId = customer.id;
        await ctx.admin
          .from("subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", ctx.user.id);
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceIdFor(plan, input.billing_interval), quantity: 1 }],
        success_url: `${env.siteUrl}/dashboard/billing?checkout=success`,
        cancel_url: `${env.siteUrl}/dashboard/billing?checkout=cancelled`,
        client_reference_id: ctx.user.id,
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id,
          plan_id: plan.id,
          billing_interval: input.billing_interval,
        },
        subscription_data: {
          metadata: {
            user_id: ctx.user.id,
            plan_id: plan.id,
            billing_interval: input.billing_interval,
          },
        },
      });

      return ok({ mode: "stripe", checkout_url: session.url, session_id: session.id });
    }

    if (!env.allowDevSubscription) {
      throw new ApiError(503, "BILLING_NOT_CONFIGURED", "Stripe billing is not configured.");
    }

    const start = new Date();
    const end = periodEnd(input.billing_interval);
    const { data: subscription, error } = await ctx.admin
      .from("subscriptions")
      .update({
        plan_id: plan.id,
        status: "active",
        billing_interval: input.billing_interval,
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
      })
      .eq("user_id", ctx.user.id)
      .select("*")
      .single();

    if (error) throw error;

    return ok({
      mode: "direct",
      checkout_url: null,
      subscription,
      message: "Subscription activated (Stripe not configured).",
    });
  });
}
