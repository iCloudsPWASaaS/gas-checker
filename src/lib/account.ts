import type { User } from "@supabase/supabase-js";
import type { AdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { TRIAL_PLAN_ID } from "@/lib/plans";

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired" | "incomplete";
  billing_interval: "monthly" | "yearly";
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanRecord = {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  features: string[];
  max_users: number;
  max_reports: number | null;
  sort_order: number;
  is_active: boolean;
  stripe_price_monthly?: string | null;
  stripe_price_yearly?: string | null;
};

export type Account = {
  profile: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  subscription: SubscriptionRecord | null;
  plan: PlanRecord | null;
  subscription_active: boolean;
  trial_days_left: number;
  is_trialing: boolean;
};

export function isActiveStatus(subscription: SubscriptionRecord | null, now = new Date()) {
  if (!subscription) return false;
  if (subscription.status === "trialing") {
    return Boolean(subscription.trial_end && new Date(subscription.trial_end).getTime() > now.getTime());
  }
  if (subscription.status === "active") {
    if (!subscription.current_period_end) return true;
    return new Date(subscription.current_period_end).getTime() > now.getTime();
  }
  return false;
}

export async function ensureProvisioned(user: User, admin: AdminClient) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const email = user.email || (metadata.email as string) || null;
  const fullName = (metadata.full_name as string) || (metadata.name as string) || null;
  const companyName = (metadata.company_name as string) || null;
  const phone = (metadata.phone as string) || null;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      company_name: companyName,
      phone,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (profileError) throw profileError;

  const { error: settingsError } = await admin.from("settings").upsert(
    {
      user_id: user.id,
      company_name: companyName,
      email,
      phone,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (settingsError) throw settingsError;

  const { data: existing, error: existingError } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existing) {
    const platform = await getPlatformSettings(admin);
    const trialDays = platform.trial_days;
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const { error: subscriptionError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      plan_id: TRIAL_PLAN_ID,
      status: "trialing",
      billing_interval: "monthly",
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
    });
    if (subscriptionError && subscriptionError.code !== "23505") {
      throw subscriptionError;
    }
  }
}

export async function getAccount(user: User, admin?: AdminClient): Promise<Account> {
  const client = admin;
  if (!client) throw new Error("Supabase admin client is required");
  await ensureProvisioned(user, client);

  const [{ data: profile }, { data: settings }, { data: subscription }] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    client.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
    client.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  let sub = subscription as SubscriptionRecord | null;
  const now = new Date();

  if (sub && sub.status === "trialing" && sub.trial_end && new Date(sub.trial_end) < now) {
    await client.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);
    sub = { ...sub, status: "expired" };
  } else if (
    sub &&
    sub.status === "active" &&
    sub.current_period_end &&
    new Date(sub.current_period_end) < now
  ) {
    const nextStatus = sub.cancel_at_period_end ? "expired" : "past_due";
    await client.from("subscriptions").update({ status: nextStatus }).eq("id", sub.id);
    sub = { ...sub, status: nextStatus };
  }

  let plan: PlanRecord | null = null;
  if (sub?.plan_id) {
    const { data } = await client.from("plans").select("*").eq("id", sub.plan_id).maybeSingle();
    plan = (data as PlanRecord | null) || null;
  }

  const active = isActiveStatus(sub, now);
  const trialDaysLeft =
    sub?.status === "trialing" && sub.trial_end
      ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

  return {
    profile: (profile as Record<string, unknown> | null) || null,
    settings: (settings as Record<string, unknown> | null) || null,
    subscription: sub,
    plan,
    subscription_active: active,
    trial_days_left: trialDaysLeft,
    is_trialing: sub?.status === "trialing",
  };
}
