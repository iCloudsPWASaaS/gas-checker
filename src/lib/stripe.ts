import Stripe from "stripe";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

let client: Stripe | null = null;

export function getStripe() {
  if (!env.stripeSecret) {
    throw new ApiError(503, "BILLING_NOT_CONFIGURED", "Stripe billing is not configured.");
  }
  if (!client) {
    client = new Stripe(env.stripeSecret);
  }
  return client;
}

export function priceIdFor(
  plan: { id: string; stripe_price_monthly?: string | null; stripe_price_yearly?: string | null },
  interval: "monthly" | "yearly",
) {
  const fromDatabase =
    interval === "monthly" ? plan.stripe_price_monthly : plan.stripe_price_yearly;
  const price = fromDatabase || env.stripePrices[plan.id]?.[interval];
  if (!price) {
    throw new ApiError(
      503,
      "PRICE_NOT_CONFIGURED",
      `No Stripe price configured for ${plan.id} (${interval}). Add one in Admin > Plans.`,
    );
  }
  return price;
}
