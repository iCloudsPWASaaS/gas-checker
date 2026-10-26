import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, FileBadge2 } from "lucide-react";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { ReportForm } from "@/components/report-form";
import { requireWebSession } from "@/lib/session";
import { REPORT_TYPES } from "@/lib/report-types";

export const metadata: Metadata = { title: "Create report" };

const categories = ["Domestic Certificate", "Commercial Certificate", "Continuation Pages", "General"] as const;

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { type } = await searchParams;
  const selected = REPORT_TYPES.find((item) => item.id === type);

  if (selected) {
    return (
      <div>
        <Link
          href="/dashboard/reports/new"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Choose a different report
        </Link>
        <PageHeader eyebrow="New report" title={selected.name} description="Fill in the basics now - you can add appliances later." />
        <ReportForm type={selected.id} />
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/reports" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>
      <PageHeader
        eyebrow="Create new report"
        title="Pick a report to create"
        description="Choose the certificate or record you need. The layout is tailored to each document."
      />

      <div className="space-y-8">
        {categories.map((category) => {
          const items = REPORT_TYPES.filter((item) => item.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                <FileBadge2 className="h-3.5 w-3.5" /> {category}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/reports/new?type=${item.id}`}
                    className="card group flex items-center justify-between gap-3 p-4 transition hover:border-brand-200 hover:shadow-float"
                  >
                    <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-600" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
