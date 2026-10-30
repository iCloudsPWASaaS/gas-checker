import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { ToolsPanel } from "@/components/tools-panel";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Tools & manuals" };

export default async function ToolsPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Toolbox"
        title="Tools & manuals"
        description="Gas rate, pipe sizing, installation volume and boiler manual lookup in one place."
      />
      <ToolsPanel />
    </div>
  );
}
