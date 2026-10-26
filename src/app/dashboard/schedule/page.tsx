import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { ScheduleManager } from "@/components/schedule-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Diary"
        title="Schedule"
        description="Plan jobs, landlord visits and follow-ups. Tap a day to see what is booked."
      />
      <ScheduleManager />
    </div>
  );
}
