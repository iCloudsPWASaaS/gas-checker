import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { formatDateTime, formatMoney, humanStatus } from "@/lib/utils";

export const metadata = { title: "Admin payments" };

const PAGE_SIZE = 50;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; page?: string }>;
}) {
  const session = await requireAdminPage();
  const { method, page } = await searchParams;
  const currentPage = Math.max(Math.trunc(Number(page || 1)) || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  let query = session.admin
    .from("payments")
    .select("*", { count: "exact" })
    .order("paid_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (method) query = query.eq("method", method);

  const [{ data: payments, count }, platform] = await Promise.all([
    query,
    getPlatformSettings(session.admin),
  ]);

  const rows = payments || [];
  const docIds = [...new Set(rows.map((payment) => payment.document_id))];
  const userIds = [...new Set(rows.map((payment) => payment.user_id))];

  const [{ data: documents }, { data: profiles }] = await Promise.all([
    docIds.length
      ? session.admin.from("documents").select("id,number,client_name,user_id").in("id", docIds)
      : Promise.resolve({ data: [] as { id: string; number: string; client_name: string; user_id: string }[] }),
    userIds.length
      ? session.admin.from("profiles").select("id,email,full_name,company_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null; full_name: string | null; company_name: string | null }[] }),
  ]);

  const docMap = new Map((documents || []).map((doc) => [doc.id, doc]));
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const total = count || 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const currency = platform.default_currency || "GBP";

  function href(targetPage: number, nextMethod = method) {
    const params = new URLSearchParams();
    if (nextMethod) params.set("method", nextMethod);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `/admin/payments?${suffix}` : "/admin/payments";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Revenue"
        title="Payments"
        description="Every payment recorded against customer invoices, newest first."
        action={
          <Link href="/admin/orders" className="btn-secondary">
            View orders
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { label: "All methods", value: "" },
          { label: "Cash", value: "cash" },
          { label: "Card", value: "card" },
          { label: "Bank", value: "bank" },
          { label: "Cheque", value: "cheque" },
          { label: "iZettle", value: "izettle" },
          { label: "Other", value: "other" },
        ].map((tab) => (
          <Link
            key={tab.value || "all"}
            href={href(1, tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              (method || "") === tab.value ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-500">{total} payments</span>
      </div>

      <div className="table-wrap">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Paid</th>
              <th className="th">Amount</th>
              <th className="th">Method</th>
              <th className="th">Invoice</th>
              <th className="th">Client</th>
              <th className="th">Account</th>
              <th className="th">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((payment) => {
              const doc = docMap.get(payment.document_id);
              const profile = profileMap.get(payment.user_id);
              return (
                <tr key={payment.id} className="hover:bg-slate-50/70">
                  <td className="td text-xs text-slate-500">{formatDateTime(payment.paid_at)}</td>
                  <td className="td text-sm font-bold text-slate-900">{formatMoney(payment.amount, currency)}</td>
                  <td className="td text-xs">{humanStatus(payment.method)}</td>
                  <td className="td text-xs">
                    {doc ? (
                      <Link href={`/admin/orders/${doc.id}`} className="font-semibold text-brand-700 hover:underline">
                        {doc.number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="td text-xs text-slate-600">{doc?.client_name || "—"}</td>
                  <td className="td text-xs">
                    <Link href={`/admin/users/${payment.user_id}`} className="font-semibold text-slate-700 hover:text-brand-700">
                      {profile?.company_name || profile?.full_name || profile?.email || "User"}
                    </Link>
                  </td>
                  <td className="td text-xs text-slate-500">{payment.reference || "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="td py-10 text-center text-slate-500">
                  No payments recorded.
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
