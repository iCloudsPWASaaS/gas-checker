import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileBadge2, FileClock, Plus } from "lucide-react";
import { Badge, PageHeader, StatCard, UpgradeNotice } from "@/components/ui";
import { requireWebSession } from "@/lib/session";
import { reportTypeName } from "@/lib/report-types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { status } = await searchParams;
  const { data } = await session.admin
    .from("gas_reports")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const reports = data || [];
  const filtered = status ? reports.filter((report) => report.status === status) : reports;
  const completed = reports.filter((report) => report.status === "completed");
  const drafts = reports.filter((report) => ["draft", "in_progress"].includes(report.status));
  const cutoff = Date.now() - 30 * 86400000;
  const overdue = drafts.filter((report) => new Date(report.created_at).getTime() < cutoff);

  return (
    <div>
      <PageHeader
        eyebrow="Certificates"
        title="Gas reports"
        description="Create and manage gas safety certificates, warning notices and service records."
        action={
          <Link href="/dashboard/reports/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New report
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total reports" value={reports.length} hint="All time" icon={FileBadge2} />
        <StatCard label="Completed" value={completed.length} hint="Certificates issued" icon={CheckCircle2} tone="brand" />
        <StatCard label="In progress" value={drafts.length} hint={`${overdue.length} overdue`} icon={FileClock} tone="amber" />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap gap-1.5">
        <Link href="/dashboard/reports" className={`badge ${!status ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
          All
        </Link>
        {["draft", "in_progress", "completed", "cancelled"].map((value) => (
          <Link
            key={value}
            href={`/dashboard/reports?status=${value}`}
            className={`badge capitalize ${status === value ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {value.replace("_", " ")}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <FileBadge2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-900">No reports{status ? ` with status ${status}` : " yet"}</p>
          <p className="mt-1 text-xs text-slate-500">Pick a certificate type and start your first report.</p>
          <Link href="/dashboard/reports/new" className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> Create new report
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <th className="th">Type</th>
                <th className="th">Reference</th>
                <th className="th">Property</th>
                <th className="th">Created</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((report) => (
                <tr key={report.id} className="transition hover:bg-slate-50/70">
                  <td className="td">
                    <Link href={`/dashboard/reports/${report.id}`} className="font-semibold text-brand-700 hover:underline">
                      {reportTypeName(report.type)}
                    </Link>
                    {report.certificate_number && <p className="text-xs text-slate-400">{report.certificate_number}</p>}
                  </td>
                  <td className="td">{report.reference || "—"}</td>
                  <td className="td">
                    <p className="font-medium text-slate-900">{report.property_name || "—"}</p>
                    {report.property_postcode && <p className="text-xs text-slate-400">{report.property_postcode}</p>}
                  </td>
                  <td className="td text-xs">{formatDate(report.created_at)}</td>
                  <td className="td">
                    <Badge status={report.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
