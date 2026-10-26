import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { BillingClient } from "@/components/billing-client";
import { requireWebSession } from "@/lib/session";
import { loadPlans } from "@/lib/auth-service";

export const metadata: Metadata = { title: "Billing & plans" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const session = await requireWebSession();
  const { checkout } = await searchParams;
  const account = session.account;
  const plans = await loadPlans(session.admin);

  return (
    <div>
      <PageHeader
        eyebrow="Subscription"
        title="Billing & plans"
        description="Every new account gets 30 days of Professional free. Change or cancel at any time."
      />
      <BillingClient
        plans={plans}
        subscription={account?.subscription || null}
        activePlanId={account?.plan?.id || account?.subscription?.plan_id || null}
        active={account?.subscription_active || false}
        isTrialing={account?.is_trialing || false}
        trialDaysLeft={account?.trial_days_left || 0}
        checkout={checkout}
      />
    </div>
  );
}
