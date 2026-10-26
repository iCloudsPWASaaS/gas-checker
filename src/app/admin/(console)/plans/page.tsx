import { PageHeader } from "@/components/ui";
import { AdminPlansManager } from "@/components/admin/admin-plans-manager";
import { requireAdminPage } from "@/lib/admin";
import type { PlanRecord } from "@/lib/account";

export const metadata = { title: "Admin plans" };

export default async function AdminPlansPage() {
  const session = await requireAdminPage();
  const { data } = await session.admin.from("plans").select("*").order("sort_order");

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Plans"
        description="Create and edit the plans customers see at checkout. Keep Stripe price IDs in sync for live payments."
      />
      <AdminPlansManager plans={(data || []) as PlanRecord[]} />
    </div>
  );
}
