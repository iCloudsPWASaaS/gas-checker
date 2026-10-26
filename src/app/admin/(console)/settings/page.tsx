import { PageHeader } from "@/components/ui";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { requireAdminPage } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";

export const metadata = { title: "Admin platform settings" };

export default async function AdminSettingsPage() {
  const session = await requireAdminPage();
  const settings = await getPlatformSettings(session.admin);

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Control signups, the default trial length, support contact and the customer announcement banner."
      />
      <AdminSettingsForm settings={settings} />
    </div>
  );
}
