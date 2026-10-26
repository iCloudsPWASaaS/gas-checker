import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePoundSterling,
  Banknote,
  FilePlus2,
  FileText,
  FolderOpen,
  Plus,
  ReceiptText,
} from "lucide-react";
import { Badge, PageHeader, StatCard, UpgradeNotice } from "@/components/ui";
import { requireWebSession } from "@/lib/session";
import { markOverdueInvoices } from "@/lib/documents";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

const hub = [
  { label: "Quote", description: "Create a quote", href: "/dashboard/quotes/new", icon: FilePlus2 },
  { label: "Quote folder", description: "All quotes", href: "/dashboard/quotes", icon: FolderOpen },
  { label: "Invoice", description: "Create an invoice", href: "/dashboard/invoices/new", icon: FilePlus2 },
  { label: "Invoice folder", description: "All invoices", href: "/dashboard/invoices", icon: FolderOpen },
  { label: "Payment", description: "Part-paid invoices", href: "/dashboard/invoices?status=partially_paid", icon: Banknote },
  { label: "Paid", description: "Settled invoices", href: "/dashboard/invoices?status=paid", icon: BadgePoundSterling },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireWebSession();
  if (!session.account) return null;
  if (!session.account.subscription_active) return <UpgradeNotice trialEnded />;

  const { status } = await searchParams;
  await markOverdueInvoices(session.admin, session.user.id);

  const { data } = await session.admin
    .from("documents")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("type", "invoice")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  const invoices = data || [];
  const filtered = status ? invoices.filter((invoice) => invoice.status === status) : invoices;
  const currency = (session.account.settings?.currency as string) || "GBP";
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
  const paid = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
  const overdue = invoices.filter((invoice) => invoice.status === "overdue").length;

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Invoices"
        description="Quotes, invoices, payments and paid jobs - all in one ledger."
        action={
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatMoney(outstanding, currency)} hint={`${invoices.length} invoices`} icon={ReceiptText} tone="amber" />
        <StatCard label="Collected" value={formatMoney(paid, currency)} hint="All payments" icon={Banknote} tone="brand" />
        <StatCard label="Overdue" value={overdue} hint="Need chasing" icon={FileText} tone="red" />
        <StatCard label="Total invoiced" value={formatMoney(invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0), currency)} hint="Lifetime" icon={BadgePoundSterling} tone="blue" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {hub.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="card group flex flex-col gap-2 p-4 transition hover:border-brand-200 hover:shadow-float"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">{item.label}</p>
              <p className="text-[10px] text-slate-500">{item.description}</p>
            </div>
            <ArrowRight className="mt-auto h-3.5 w-3.5 self-end text-slate-300 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>

      <div className="mt-8 mb-3 flex flex-wrap gap-1.5">
        <Link href="/dashboard/invoices" className={`badge ${!status ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
          All
        </Link>
        {["draft", "sent", "overdue", "partially_paid", "paid"].map((value) => (
          <Link
            key={value}
            href={`/dashboard/invoices?status=${value}`}
            className={`badge capitalize ${status === value ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {value.replace("_", " ")}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <ReceiptText className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-900">No invoices{status ? ` with status ${status.replace("_", " ")}` : " yet"}</p>
          <p className="mt-1 text-xs text-slate-500">Create an invoice or convert an accepted quote.</p>
          <Link href="/dashboard/invoices/new" className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-200 bg-slate-50/60">
              <tr>
                <th className="th">Invoice</th>
                <th className="th">Client</th>
                <th className="th">Issued</th>
                <th className="th">Due</th>
                <th className="th text-right">Total</th>
                <th className="th text-right">Outstanding</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="transition hover:bg-slate-50/70">
                  <td className="td font-semibold">
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="text-brand-700 hover:underline">
                      {invoice.number}
                    </Link>
                  </td>
                  <td className="td">
                    <p className="font-medium text-slate-900">{invoice.client_name}</p>
                    {invoice.client_email && <p className="text-xs text-slate-400">{invoice.client_email}</p>}
                  </td>
                  <td className="td text-xs">{formatDate(invoice.issue_date)}</td>
                  <td className="td text-xs">{formatDate(invoice.due_date)}</td>
                  <td className="td text-right font-semibold">{formatMoney(invoice.total, currency)}</td>
                  <td className="td text-right">{formatMoney(invoice.balance, currency)}</td>
                  <td className="td">
                    <Badge status={invoice.status} />
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
