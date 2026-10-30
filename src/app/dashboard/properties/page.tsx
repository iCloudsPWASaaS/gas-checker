import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { PropertiesManager } from "@/components/properties-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Job addresses" };

export default async function PropertiesPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Properties"
        title="Job addresses"
        description="Save the places you visit once, then reuse them on jobs, certificates and invoices."
      />
      <PropertiesManager />
    </div>
  );
}
