import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { BackupManager } from "@/components/backup-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Backup & restore" };

export default async function BackupPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Data safety"
        title="Backup / Restore"
        description="Keep a portable copy of your business data. Download it or store it in your Supabase bucket."
      />
      <BackupManager />
    </div>
  );
}
