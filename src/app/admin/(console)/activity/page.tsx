import { ScrollText, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { formatDateTime, humanStatus } from "@/lib/utils";

export const metadata = { title: "Admin audit log" };

export default async function AdminActivityPage() {
  const session = await requireAdminPage();
  const { data, error } = await session.admin
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Audit log"
        description="Every admin change to plans, subscriptions, user roles and platform settings."
      />

      {error ? (
        <div className="card flex items-start gap-3 p-5 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Audit log is not available yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              Run <code className="code">supabase/migrations/0002_admin.sql</code> in Supabase to create the admin tables.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">When</th>
                <th className="th">Admin</th>
                <th className="th">Action</th>
                <th className="th">Entity</th>
                <th className="th">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data || []).map((entry) => (
                <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                  <td className="td whitespace-nowrap text-xs text-slate-500">{formatDateTime(entry.created_at)}</td>
                  <td className="td text-xs">
                    <p className="font-semibold text-slate-700">{entry.admin_email || "Unknown admin"}</p>
                    <p className="text-[10px] text-slate-400">{entry.admin_user_id || "standalone admin"}</p>
                  </td>
                  <td className="td">
                    <span className="badge bg-slate-100 text-slate-700">{humanStatus(entry.action.replaceAll(".", " "))}</span>
                  </td>
                  <td className="td text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">{entry.entity_type}</p>
                    <p className="break-all font-mono text-[10px]">{entry.entity_id || "—"}</p>
                  </td>
                  <td className="td">
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-brand-700">View JSON</summary>
                      <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-slate-950 p-3 text-[10px] text-slate-200">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
              {(data || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="td py-12 text-center text-slate-500">
                    <ScrollText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                    No admin activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
