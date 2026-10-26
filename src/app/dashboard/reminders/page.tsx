import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { RemindersManager } from "@/components/reminders-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Follow-up"
        title="Reminders"
        description="Never lose track of a landlord visit, overdue invoice or certificate."
      />
      <RemindersManager />
    </div>
  );
}
