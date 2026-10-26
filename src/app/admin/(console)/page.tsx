import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  FileBadge2,
  Layers,
  ReceiptText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, PageHeader, SectionTitle, StatCard } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { isActiveStatus, type PlanRecord, type SubscriptionRecord } from "@/lib/account";
import { formatDate, formatDateTime, formatMoney, humanStatus } from "@/lib/utils";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const session = await requireAdminPage();
  const admin = session.admin;

  const [
    profiles,
    subscriptions,
    plans,
    invoices,
    payments,
    reportsCount,
    contactsCount,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(6),
    admin.from("subscriptions").select("*").limit(2000),
    admin.from("plans").select("*").order("sort_order"),
    admin.from("documents").select("*").eq("type", "invoice").limit(2000),
    admin.from("payments").select("*").order("paid_at", { ascending: false }).limit(2000),
    admin.from("gas_reports").select("*", { count: "exact", head: true }),
    admin.from("contacts").select("*", { count: "exact", head: true }),
  ]);

  const planMap = new Map<string, PlanRecord>();
  for (const plan of (plans.data || []) as PlanRecord[]) planMap.set(plan.id, plan);

  const subs = (subscriptions.data || []) as SubscriptionRecord[];
  const activePaid = subs.filter((sub) => sub.status === "active" && isActiveStatus(sub));
  const trialing = subs.filter((sub) => sub.status === "trialing" && isActiveStatus(sub));
  const expired = subs.filter((sub) => ["expired", "canceled"].includes(sub.status));
  const currency = planMap.get("pro")?.currency || "GBP";

  let mrr = 0;
  for (const sub of activePaid) {
    const plan = planMap.get(sub.plan_id);
    if (!plan) continue;
    mrr += sub.billing_interval === "yearly" ? Number(plan.yearly_price) / 12 : Number(plan.monthly_price);
  }

  const invoiceRows = invoices.data || [];
  const outstanding = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
  const revenue = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
  const overdueInvoices = invoiceRows.filter((invoice) => invoice.status === "overdue").length;

  const paymentRows = payments.data || [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const collectedThisMonth = paymentRows
    .filter((payment) => payment.paid_at && new Date(payment.paid_at) >= startOfMonth)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const recentPayments = paymentRows.slice(0, 5);
  const paymentDocIds = [...new Set(recentPayments.map((payment) => payment.document_id))];
  const paymentUserIds = [...new Set(recentPayments.map((payment) => payment.user_id))];

  const [{ data: paymentDocs }, { data: paymentProfiles }] = await Promise.all([
    paymentDocIds.length
      ? admin.from("documents").select("id,number,client_name").in("id", paymentDocIds)
      : Promise.resolve({ data: [] as { id: string; number: string; client_name: string }[] }),
    paymentUserIds.length
      ? admin.from("profiles").select("id,email,full_name,company_name").in("id", paymentUserIds)
      : Promise.resolve({ data: [] as { id: string; email: string | null; full_name: string | null; company_name: string | null }[] }),
  ]);

  const paymentDocMap = new Map((paymentDocs || []).map((doc) => [doc.id, doc]));
  const paymentProfileMap = new Map((paymentProfiles || []).map((profile) => [profile.id, profile]));
  const profileSubMap = new Map(subs.map((sub) => [sub.user_id, sub]));

  const quickLinks = [
    { href: "/admin/users", label: "Manage users", icon: Users },
    { href: "/admin/plans", label: "Edit plans", icon: Layers },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { href: "/admin/settings", label: "Platform settings", icon: Settings },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Platform overview"
        description="Users, revenue, subscriptions and account health across Gas Checker."
        action={
          <Link href="/admin/users" className="btn-primary">
            <Users className="h-4 w-4" /> User directory
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={profiles.count || 0} hint={`${trialing.length} trialing`} icon={Users} />
        <StatCard label="MRR" value={formatMoney(mrr, currency)} hint={`${activePaid.length} paid subscriptions`} icon={TrendingUp} tone="blue" />
        <StatCard label="Outstanding" value={formatMoney(outstanding, currency)} hint={`${overdueInvoices} overdue invoices`} icon={Banknote} tone="amber" />
        <StatCard label="Collected this month" value={formatMoney(collectedThisMonth, currency)} hint={`${formatMoney(revenue, currency)} all time`} icon={ReceiptText} tone="slate" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Certificates" value={reportsCount.count || 0} hint="All gas reports" icon={FileBadge2} />
        <StatCard label="Contacts" value={contactsCount.count || 0} hint="Across all accounts" icon={Users} tone="blue" />
        <StatCard label="Expired / cancelled" value={expired.length} hint="Subscriptions needing attention" icon={Sparkles} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section>
          <SectionTitle
            action={
              <Link href="/admin/users" className="text-xs font-bold text-brand-700">
                View all
              </Link>
            }
          >
            Recent signups
          </SectionTitle>
          <div className="table-wrap">
            <table className="w-full min-w-[560px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">User</th>
                  <th className="th">Plan</th>
                  <th className="th">Status</th>
                  <th className="th">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(profiles.data || []).map((profile) => {
                  const sub = profileSubMap.get(profile.id);
                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        <Link href={`/admin/users/${profile.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                          {profile.full_name || profile.email || "Unnamed user"}
                        </Link>
                        <p className="text-xs text-slate-500">{profile.email}</p>
                      </td>
                      <td className="td text-xs">{sub ? planMap.get(sub.plan_id)?.name || sub.plan_id : "—"}</td>
                      <td className="td">{sub ? <Badge status={sub.status} /> : <Badge status="incomplete" label="No subscription" />}</td>
                      <td className="td text-xs text-slate-500">{formatDate(profile.created_at)}</td>
                    </tr>
                  );
                })}
                {(profiles.data || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="td text-center text-slate-500">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <SectionTitle
              action={
                <Link href="/admin/payments" className="text-xs font-bold text-brand-700">
                  All payments
                </Link>
              }
            >
              Recent payments
            </SectionTitle>
            <div className="card divide-y divide-slate-100">
              {recentPayments.map((payment) => {
                const doc = paymentDocMap.get(payment.document_id);
                const profile = paymentProfileMap.get(payment.user_id);
                return (
                  <div key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {formatMoney(payment.amount, currency)} · {humanStatus(payment.method)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {doc ? `${doc.number} · ${doc.client_name}` : payment.reference || "Payment"} ·{" "}
                        {profile?.company_name || profile?.full_name || profile?.email || "User"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatDateTime(payment.paid_at)}</span>
                  </div>
                );
              })}
              {recentPayments.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No payments yet.</p>}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
            <div className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <link.icon className="h-4 w-4 text-brand-600" />
                  {link.label}
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Subscription mix</h2>
            <div className="mt-3 space-y-2 text-xs">
              {[
                { label: "Paid active", value: activePaid.length, tone: "bg-brand-500" },
                { label: "Trialing", value: trialing.length, tone: "bg-blue-500" },
                { label: "Expired / cancelled", value: expired.length, tone: "bg-slate-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className={`h-2 w-2 rounded-full ${row.tone}`} /> {row.label}
                  </span>
                  <span className="font-extrabold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              MRR counts paid active subscriptions only. Yearly plans are divided by 12.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
