import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText, Flame, MapPin, TriangleAlert } from "lucide-react";
import { Badge, UpgradeNotice } from "@/components/ui";
import { ReportActions } from "@/components/report-actions";
import { requireWebSession } from "@/lib/session";
import { reportTypeName } from "@/lib/report-types";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Gas report" };

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { id } = await params;
  const { data: report } = await session.admin
    .from("gas_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!report) notFound();

  const { data: contact } = report.contact_id
    ? await session.admin.from("contacts").select("*").eq("id", report.contact_id).maybeSingle()
    : { data: null };

  const appliances = Array.isArray(report.appliances) ? (report.appliances as Record<string, unknown>[]) : [];
  const defects = Array.isArray(report.defects) ? (report.defects as Record<string, unknown>[]) : [];
  const settings = (session.account.settings || {}) as Record<string, unknown>;

  return (
    <div>
      <Link href="/dashboard/reports" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 print:hidden">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Gas report</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{reportTypeName(report.type)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge status={report.status} />
            {report.reference && <span>Ref {report.reference}</span>}
            {report.certificate_number && <span>Cert {report.certificate_number}</span>}
            <span>Created {formatDate(report.created_at)}</span>
          </div>
        </div>
        <ReportActions id={report.id} status={report.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-slate-950 px-6 py-5 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">{(settings.company_name as string) || "Gas Checker"}</p>
                <p className="text-xs text-slate-400">
                  {[settings.phone, settings.email].filter(Boolean).join(" · ") || "Gas safety record"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Property</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{report.property_name || "—"}</p>
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {[
                    report.property_address_line1,
                    report.property_address_line2,
                    report.property_address_line3,
                    report.property_postcode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No address recorded"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Client</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{contact?.name || "—"}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {[contact?.phone, contact?.email].filter(Boolean).join(" · ") || "No contact details"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-y border-slate-100 bg-slate-50/70 px-6 py-3 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Job ID</p>
                <p className="mt-0.5 font-semibold text-slate-700">{report.job_id || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Engineer ID</p>
                <p className="mt-0.5 font-semibold text-slate-700">{(settings.gas_engineer_id as string) || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Completed</p>
                <p className="mt-0.5 font-semibold text-slate-700">
                  {report.completed_at ? formatDateTime(report.completed_at) : "—"}
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <h2 className="text-sm font-bold text-slate-900">Site notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {report.notes || "No notes recorded yet. Add appliances and observations through the Flutter app or API."}
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ClipboardList className="h-4 w-4 text-brand-600" /> Appliances ({appliances.length})
            </h2>
            {appliances.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No appliances saved. Use the API to attach appliance records as JSON - see the Flutter docs.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {appliances.map((appliance, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <pre className="whitespace-pre-wrap break-all text-slate-600">{JSON.stringify(appliance, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <TriangleAlert className="h-4 w-4 text-amber-500" /> Defects ({defects.length})
            </h2>
            {defects.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No defects recorded.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {defects.map((defect, index) => (
                  <pre key={index} className="whitespace-pre-wrap break-all rounded-xl bg-red-50 p-3 text-[11px] text-red-700">
                    {JSON.stringify(defect, null, 2)}
                  </pre>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4 text-slate-400" /> PDF
            </h2>
            {report.pdf_url ? (
              <a href={report.pdf_url} target="_blank" rel="noreferrer" className="btn-secondary mt-3 w-full text-xs">
                Open PDF
              </a>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No PDF attached. Generate one in the mobile app and save its URL here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
