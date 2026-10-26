import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { ContactsManager } from "@/components/contacts-manager";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Contacts"
        description="Landlords, agents, suppliers and installations."
      />
      <ContactsManager />
    </div>
  );
}
