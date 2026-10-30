import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { JobsManager } from "@/components/jobs-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Jobs"
        description="Track each visit from first call to completed work. Link the customer, job address and status in one place."
      />
      <JobsManager />
    </div>
  );
}
