import Link from "next/link";
import { ChevronLeft, ChevronRight, CreditCard, Search } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { formatDate, humanStatus } from "@/lib/utils";

export const metadata = { title: "Admin subscriptions" };

const PAGE_SIZE = 25;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>;
}) {
  const session = await requireAdminPage();
  const { q, status, plan, page } = await searchParams;
  const search = (q || "").trim();
  const safeSearch = search.replace(/[%,()]/g, "");
  const currentPage = Math.max(Math.trunc(Number(page || 1)) || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;

  let matchingIds: string[] | null = null;
  if (safeSearch) {
    const { data: matches } = await session.admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%,company_name.ilike.%${safeSearch}%`)
      .limit(500);
    matchingIds = (matches || []).map((profile) => profile.id);
  }

  let query = session.admin
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (matchingIds) {
    if (matchingIds.length === 0) {
      query = query.eq("user_id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("user_id", matchingIds);
    }
  }
  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan_id", plan);

  const [{ data: subscriptions, count }, { data: plans }] = await Promise.all([
    query,
    session.admin.from("plans").select("id,name").order("sort_order"),
  ]);

  const rows = subscriptions || [];
  const userIds = [...new Set(rows.map((sub) => sub.user_id))];
  const { data: profiles } = userIds.length
    ? await session.admin.from("profiles").select("id,email,full_name,company_name").in("id", userIds)
    : { data: [] as { id: string; email: string | null; full_name: string | null; company_name: string | null }[] };

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const planMap = new Map((plans || []).map((item) => [item.id, item]));
  const total = count || 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  function href(targetPage: number, nextStatus = status) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (nextStatus) params.set("status", nextStatus);
    if (plan) params.set("plan", plan);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `/admin/subscriptions?${suffix}` : "/admin/subscriptions";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Every trial and paid subscription. Open a user to change plan, status or billing dates."
        action={
          <Link href="/admin/plans" className="btn-secondary">
            <CreditCard className="h-4 w-4" /> Manage plans
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { label: "All", value: "" },
          { label: "Trialing", value: "trialing" },
          { label: "Active", value: "active" },
          { label: "Past due", value: "past_due" },
          { label: "Expired", value: "expired" },
          { label: "Cancelled", value: "canceled" },
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

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/subscriptions">
        {status && <input type="hidden" name="status" value={status} />}
        {plan && <input type="hidden" name="plan" value={plan} />}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={search} className="input pl-9" placeholder="Search user name, email or company" />
        </div>
        <select name="plan" defaultValue={plan || ""} className="input w-auto min-w-[160px]">
          <option value="">All plans</option>
          {(plans || []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Filter
        </button>
        {(search || plan) && (
          <Link href={href(1)} className="btn-secondary">
            Clear
          </Link>
        )}
        <span className="ml-auto text-xs font-semibold text-slate-500">{total} subscriptions</span>
      </form>

      <div className="table-wrap">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">User</th>
              <th className="th">Plan</th>
              <th className="th">Status</th>
              <th className="th">Interval</th>
              <th className="th">Trial / period end</th>
              <th className="th">Renewal</th>
              <th className="th text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((sub) => {
              const profile = profileMap.get(sub.user_id);
              return (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="td">
                    <Link href={`/admin/users/${sub.user_id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {profile?.full_name || profile?.email || sub.user_id}
                    </Link>
                    <p className="text-xs text-slate-500">{profile?.company_name || profile?.email}</p>
                  </td>
                  <td className="td text-xs">{planMap.get(sub.plan_id)?.name || sub.plan_id}</td>
                  <td className="td">
                    <Badge status={sub.status} />
                  </td>
                  <td className="td text-xs">{humanStatus(sub.billing_interval)}</td>
                  <td className="td text-xs text-slate-500">
                    {sub.status === "trialing"
                      ? sub.trial_end
                        ? `Trial ends ${formatDate(sub.trial_end)}`
                        : "No trial end"
                      : sub.current_period_end
                        ? formatDate(sub.current_period_end)
                        : "—"}
                  </td>
                  <td className="td text-xs">
                    {sub.cancel_at_period_end ? (
                      <span className="font-semibold text-amber-700">Cancels at period end</span>
                    ) : (
                      <span className="text-slate-500">{humanStatus(sub.status)}</span>
                    )}
                  </td>
                  <td className="td text-right">
                    <Link href={`/admin/users/${sub.user_id}`} className="text-xs font-bold text-brand-700 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="td py-10 text-center text-slate-500">
                  No subscriptions match these filters.
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
