import type Stripe from "stripe";
import { handleRoute, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type StripeSubscriptionShape = {
  id: string;
  status: string;
  customer: string | { id: string };
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ current_period_end?: number }> };
};

function currentPeriodEnd(subscription: StripeSubscriptionShape) {
  const timestamp = subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function mapStripeStatus(status: string) {
  if (["active"].includes(status)) return "active";
  if (["trialing"].includes(status)) return "trialing";
  if (["past_due", "unpaid"].includes(status)) return "past_due";
  if (["canceled", "incomplete_expired"].includes(status)) return "canceled";
  if (["incomplete"].includes(status)) return "incomplete";
  return "past_due";
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    if (!env.stripeSecret) {
      return ok({ received: true, skipped: "Stripe not configured" });
    }

    const signature = request.headers.get("stripe-signature");
    const payload = await request.text();

    if (!signature || !env.stripeWebhookSecret) {
      return ok({ received: true, skipped: "Missing signature or webhook secret" });
    }

    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, env.stripeWebhookSecret);
    } catch {
      return ok({ received: false, error: "Invalid signature" }, undefined, { status: 400 });
    }

    const admin = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id || session.client_reference_id;
      const planId = session.metadata?.plan_id;
      const interval = session.metadata?.billing_interval;

      if (userId && planId) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        await admin
          .from("subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            billing_interval: interval === "yearly" ? "yearly" : "monthly",
            current_period_start: new Date().toISOString(),
            current_period_end:
              interval === "yearly"
                ? new Date(Date.now() + 365 * 86400000).toISOString()
                : new Date(Date.now() + 30 * 86400000).toISOString(),
            cancel_at_period_end: false,
            stripe_subscription_id: subscriptionId || null,
            stripe_customer_id: customerId || null,
          })
          .eq("user_id", userId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as unknown as StripeSubscriptionShape;
      const status =
        event.type === "customer.subscription.deleted" ? "canceled" : mapStripeStatus(subscription.status);
      const patch: Record<string, unknown> = {
        status,
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEnd(subscription),
      };
      if (subscription.metadata?.plan_id) {
        patch.plan_id = subscription.metadata.plan_id;
      }
      if (subscription.metadata?.billing_interval) {
        patch.billing_interval = subscription.metadata.billing_interval;
      }

      await admin.from("subscriptions").update(patch).eq("stripe_subscription_id", subscription.id);
    }

    return ok({ received: true, type: event.type });
  });
}
