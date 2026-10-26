import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  FileBadge2,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge, PageHeader, StatCard } from "@/components/ui";
import { AdminRoleEditor } from "@/components/admin/admin-role-editor";
import { AdminSubscriptionEditor } from "@/components/admin/admin-subscription-editor";
import { requireAdminPage } from "@/lib/admin";
import { formatDate, formatDateTime, formatMoney, humanStatus } from "@/lib/utils";

export const metadata = { title: "Admin user" };

type Params = { params: Promise<{ id: string }> };

export default async function AdminUserDetailPage({ params }: Params) {
  const session = await requireAdminPage();
  const { id } = await params;
  const admin = session.admin;

  const { data: profile } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!profile) notFound();

  const [
    subscriptionResult,
    settingsResult,
    plansResult,
    contactsCount,
    documentsCount,
    reportsCount,
    paymentsResult,
    recentDocuments,
  ] = await Promise.all([
    admin.from("subscriptions").select("*").eq("user_id", id).maybeSingle(),
    admin.from("settings").select("*").eq("user_id", id).maybeSingle(),
    admin.from("plans").select("id,name").order("sort_order"),
    admin.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", id),
    admin.from("documents").select("*", { count: "exact", head: true }).eq("user_id", id),
    admin.from("gas_reports").select("*", { count: "exact", head: true }).eq("user_id", id),
    admin.from("payments").select("*").eq("user_id", id).order("paid_at", { ascending: false }).limit(5),
    admin.from("documents").select("*").eq("user_id", id).eq("type", "invoice").order("created_at", { ascending: false }).limit(6),
  ]);

  const subscription = subscriptionResult.data;
  const settings = (settingsResult.data || {}) as Record<string, unknown>;
  const plans = (plansResult.data || []) as { id: string; name: string }[];
  const plan = plans.find((item) => item.id === subscription?.plan_id);
  const currency = (settings.currency as string) || "GBP";

  const paymentRows = paymentsResult.data || [];
  const paymentDocIds = [...new Set(paymentRows.map((payment) => payment.document_id))];
  const { data: paymentDocs } = paymentDocIds.length
    ? await admin.from("documents").select("id,number,client_name").in("id", paymentDocIds)
    : { data: [] as { id: string; number: string; client_name: string }[] };
  const docMap = new Map((paymentDocs || []).map((doc) => [doc.id, doc]));

  const address = [
    settings.company_address_line1,
    settings.company_address_line2,
    settings.company_address_line3,
    settings.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to users
      </Link>

      <PageHeader
        eyebrow="Account"
        title={profile.full_name || profile.email || "Unnamed user"}
        description={profile.email || undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${profile.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              <ShieldCheck className="mr-1 h-3 w-3" /> {profile.role || "owner"}
            </span>
            {subscription ? <Badge status={subscription.status} /> : <Badge status="incomplete" label="No subscription" />}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contacts" value={contactsCount.count || 0} icon={Users} />
        <StatCard label="Documents" value={documentsCount.count || 0} hint="Invoices & quotes" icon={ReceiptText} tone="blue" />
        <StatCard label="Certificates" value={reportsCount.count || 0} icon={FileBadge2} tone="amber" />
        <StatCard label="Current plan" value={plan?.name || "None"} hint={subscription ? humanStatus(subscription.status) : "No subscription"} icon={CalendarDays} tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 className="h-4 w-4 text-brand-600" /> Business profile
            </h2>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Company</p>
                <p className="mt-0.5 font-semibold text-slate-700">{(settings.company_name as string) || profile.company_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Gas engineer ID</p>
                <p className="mt-0.5 font-semibold text-slate-700">{(settings.gas_engineer_id as string) || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-0.5 flex items-center gap-1 font-semibold text-slate-700">
                  <Mail className="h-3 w-3 text-slate-400" /> {profile.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone</p>
                <p className="mt-0.5 flex items-center gap-1 font-semibold text-slate-700">
                  <Phone className="h-3 w-3 text-slate-400" /> {profile.phone || (settings.phone as string) || "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Address</p>
                <p className="mt-0.5 flex items-start gap-1 text-slate-600">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {address || "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] sm:grid-cols-4">
              <div>
                <p className="text-slate-400">Currency</p>
                <p className="font-semibold text-slate-700">{currency}</p>
              </div>
              <div>
                <p className="text-slate-400">VAT rate</p>
                <p className="font-semibold text-slate-700">{String(settings.vat_rate ?? 0)}%</p>
              </div>
              <div>
                <p className="text-slate-400">Invoice prefix</p>
                <p className="font-semibold text-slate-700">{(settings.invoice_prefix as string) || "INV"}</p>
              </div>
              <div>
                <p className="text-slate-400">Auto sync</p>
                <p className="font-semibold text-slate-700">{settings.auto_sync === false ? "Off" : "On"}</p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-900">Recent invoices</h2>
              <Link href="/admin/orders" className="text-xs font-bold text-brand-700">
                All orders
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(recentDocuments.data || []).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/admin/orders/${doc.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {doc.number} · {doc.client_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {humanStatus(doc.type)} · {formatDate(doc.issue_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatMoney(doc.total, currency)}</p>
                    <Badge status={doc.status} />
                  </div>
                </Link>
              ))}
              {(recentDocuments.data || []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No documents yet.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Banknote className="h-4 w-4 text-brand-600" /> Recent payments
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {paymentRows.map((payment) => {
                const doc = docMap.get(payment.document_id);
                return (
                  <div key={payment.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {formatMoney(payment.amount, currency)} · {humanStatus(payment.method)}
                      </p>
                      <p className="text-slate-500">
                        {doc ? `${doc.number} · ${doc.client_name}` : "Payment"}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </p>
                    </div>
                    <span className="text-slate-400">{formatDateTime(payment.paid_at)}</span>
                  </div>
                );
              })}
              {paymentRows.length === 0 && <p className="py-4 text-center text-xs text-slate-500">No payments yet.</p>}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            User ID {profile.id} · Joined {formatDate(profile.created_at)}
          </p>
        </div>

        <div className="space-y-4">
          <AdminSubscriptionEditor userId={profile.id} subscription={subscription} plans={plans} />
          <AdminRoleEditor profileId={profile.id} role={profile.role || "owner"} />
        </div>
      </div>
    </div>
  );
}
