function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get serviceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get schema() {
    return process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "gas-checker";
  },
  get storageBucket() {
    return process.env.SUPABASE_STORAGE_BUCKET || "gas-checker";
  },
  get trialDays() {
    const value = Number(process.env.TRIAL_DAYS || 30);
    return Number.isFinite(value) && value > 0 ? value : 30;
  },
  get autoConfirm() {
    return (process.env.AUTH_AUTO_CONFIRM || "true") !== "false";
  },
  get allowDevSubscription() {
    return (process.env.ALLOW_DEV_SUBSCRIPTION || "true") !== "false";
  },
  get adminEmails() {
    return (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  },
  get adminPassword() {
    return process.env.ADMIN_PASSWORD || "";
  },
  get adminSessionSecret() {
    return process.env.ADMIN_SESSION_SECRET || "";
  },
  get stripeSecret() {
    return process.env.STRIPE_SECRET_KEY || "";
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || "";
  },
  get googlePlacesKey() {
    return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
  },
  get stripePrices() {
    return {
      starter: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
      },
      business: {
        monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
        yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || "",
      },
    } as Record<string, { monthly: string; yearly: string }>;
  },
};

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
