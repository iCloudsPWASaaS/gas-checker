import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Badge, PageHeader, StatCard, UpgradeNotice } from "@/components/ui";
import { requireWebSession } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Quotes" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { status } = await searchParams;
  const { data } = await session.admin
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("type", "quote")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  const quotes = data || [];
  const filtered = status ? quotes.filter((quote) => quote.status === status) : quotes;
  const currency = (session.account.settings?.currency as string) || "GBP";
  const totalValue = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);
  const accepted = quotes.filter((quote) => quote.status === "accepted");
  const awaiting = quotes.filter((quote) => ["draft", "sent"].includes(quote.status));

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Quotes"
        description="Send professional quotes and turn accepted work into invoices."
        action={
          <Link href="/dashboard/quotes/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New quote
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Quote value" value={formatMoney(totalValue, currency)} hint={`${quotes.length} quotes`} icon={FileText} tone="blue" />
        <StatCard label="Awaiting response" value={awaiting.length} hint="Draft or sent" icon={FileText} tone="amber" />
        <StatCard label="Accepted" value={accepted.length} hint={formatMoney(accepted.reduce((sum, q) => sum + Number(q.total || 0), 0), currency)} icon={FileText} />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap gap-1.5">
        <Link href="/dashboard/quotes" className={`badge ${!status ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
          All
        </Link>
        {["draft", "sent", "accepted", "declined", "expired"].map((value) => (
          <Link
            key={value}
            href={`/dashboard/quotes?status=${value}`}
            className={`badge capitalize ${status === value ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {value}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-900">No quotes{status ? ` marked ${status}` : " yet"}</p>
          <p className="mt-1 text-xs text-slate-500">Create a quote and send it to your client.</p>
          <Link href="/dashboard/quotes/new" className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> New quote
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <th className="th">Quote</th>
                <th className="th">Client</th>
                <th className="th">Issued</th>
                <th className="th">Valid until</th>
                <th className="th text-right">Total</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((quote) => (
                <tr key={quote.id} className="transition hover:bg-slate-50/70">
                  <td className="td font-semibold">
                    <Link href={`/dashboard/quotes/${quote.id}`} className="text-brand-700 hover:underline">
                      {quote.number}
                    </Link>
                  </td>
                  <td className="td">
                    <p className="font-medium text-slate-900">{quote.client_name}</p>
                    {quote.client_email && <p className="text-xs text-slate-400">{quote.client_email}</p>}
                  </td>
                  <td className="td text-xs">{formatDate(quote.issue_date)}</td>
                  <td className="td text-xs">{formatDate(quote.valid_until)}</td>
                  <td className="td text-right font-semibold">{formatMoney(quote.total, currency)}</td>
                  <td className="td">
                    <Badge status={quote.status} />
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
