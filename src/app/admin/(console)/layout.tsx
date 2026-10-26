import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();

  return (
    <AdminShell name="Administrator" email={session.email}>
      {children}
    </AdminShell>
  );
}
