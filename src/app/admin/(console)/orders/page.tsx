import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Admin orders" };

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requireAdminPage();
  const { q, status, page } = await searchParams;
  const search = (q || "").trim();
  const safeSearch = search.replace(/[%,()]/g, "");
  const currentPage = Math.max(Math.trunc(Number(page || 1)) || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  let query = session.admin
    .from("documents")
    .select("*", { count: "exact" })
    .eq("type", "invoice")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (safeSearch) {
    query = query.or(`number.ilike.%${safeSearch}%,client_name.ilike.%${safeSearch}%,client_email.ilike.%${safeSearch}%`);
  }

  const { data: invoices, count } = await query;
  const rows = invoices || [];
  const userIds = [...new Set(rows.map((invoice) => invoice.user_id))];
  const [{ data: profiles }, { data: settingsRows }, platform] = await Promise.all([
    userIds.length
      ? session.admin.from("profiles").select("id,email,full_name,company_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null; full_name: string | null; company_name: string | null }[] }),
    userIds.length
      ? session.admin.from("settings").select("user_id,currency").in("user_id", userIds)
      : Promise.resolve({ data: [] as { user_id: string; currency: string | null }[] }),
    getPlatformSettings(session.admin),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const currencyMap = new Map((settingsRows || []).map((row) => [row.user_id, row.currency || platform.default_currency]));
  const total = count || 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  function href(targetPage: number, nextStatus = status) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (nextStatus) params.set("status", nextStatus);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `/admin/orders?${suffix}` : "/admin/orders";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Revenue"
        title="Orders & invoices"
        description="All customer invoices across every account, with payment and balance tracking."
        action={
          <Link href="/admin/payments" className="btn-secondary">
            Payment history
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { label: "All", value: "" },
          { label: "Draft", value: "draft" },
          { label: "Sent", value: "sent" },
          { label: "Part paid", value: "partially_paid" },
          { label: "Paid", value: "paid" },
          { label: "Overdue", value: "overdue" },
        ].map((tab) => (
          <Link
            key={tab.value || "all"}
            href={href(1, tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              (status || "") === tab.value ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/orders">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={search} className="input pl-9" placeholder="Search invoice number, client or email" />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
        {search && (
          <Link href={href(1)} className="btn-secondary">
            Clear
          </Link>
        )}
        <span className="ml-auto text-xs font-semibold text-slate-500">{total} invoices</span>
      </form>

      <div className="table-wrap">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Invoice</th>
              <th className="th">User</th>
              <th className="th">Client</th>
              <th className="th">Issued</th>
              <th className="th">Total</th>
              <th className="th">Paid</th>
              <th className="th">Balance</th>
              <th className="th">Status</th>
              <th className="th text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((invoice) => {
              const profile = profileMap.get(invoice.user_id);
              const currency = currencyMap.get(invoice.user_id) || platform.default_currency;
              return (
                <tr key={invoice.id} className="hover:bg-slate-50/70">
                  <td className="td">
                    <Link href={`/admin/orders/${invoice.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {invoice.number}
                    </Link>
                    <p className="text-xs text-slate-500">Due {formatDate(invoice.due_date)}</p>
                  </td>
                  <td className="td text-xs">
                    <Link href={`/admin/users/${invoice.user_id}`} className="font-semibold text-slate-700 hover:text-brand-700">
                      {profile?.company_name || profile?.full_name || profile?.email || invoice.user_id}
                    </Link>
                    <p className="text-slate-500">{profile?.email}</p>
                  </td>
                  <td className="td text-xs text-slate-600">
                    {invoice.client_name}
                    {invoice.client_email && <p className="text-slate-400">{invoice.client_email}</p>}
                  </td>
                  <td className="td text-xs text-slate-500">{formatDate(invoice.issue_date)}</td>
                  <td className="td text-sm font-bold text-slate-900">{formatMoney(invoice.total, currency)}</td>
                  <td className="td text-xs text-slate-600">{formatMoney(invoice.amount_paid, currency)}</td>
                  <td className="td text-xs font-semibold text-slate-700">{formatMoney(invoice.balance, currency)}</td>
                  <td className="td">
                    <Badge status={invoice.status} />
                  </td>
                  <td className="td text-right">
                    <Link href={`/admin/orders/${invoice.id}`} className="text-xs font-bold text-brand-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="td py-10 text-center text-slate-500">
                  No invoices match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Page {currentPage} of {pages}
        </span>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link href={href(currentPage - 1)} className="btn-secondary px-3 py-1.5 text-xs">
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Link>
          ) : null}
          {currentPage < pages ? (
            <Link href={href(currentPage + 1)} className="btn-secondary px-3 py-1.5 text-xs">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
