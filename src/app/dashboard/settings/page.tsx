import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireWebSession();
  const settings = (session.account?.settings || {}) as Record<string, unknown>;

  return (
    <div>
      <PageHeader
        eyebrow="Your business"
        title="Settings"
        description="Company details, engineer ID, email templates and document prefixes."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
