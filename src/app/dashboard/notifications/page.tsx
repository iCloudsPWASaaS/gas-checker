import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { NotificationsManager } from "@/components/notifications-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Job updates and system messages. Mark them read when you have seen them."
      />
      <NotificationsManager />
    </div>
  );
}
