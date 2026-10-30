import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BellRing,
  Briefcase,
  CalendarDays,
  Cloud,
  Contact,
  FileBadge2,
  FileText,
  Gauge,
  History,
  MapPin,
  ReceiptText,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Badge, PageHeader, SectionTitle, StatCard, UpgradeNotice } from "@/components/ui";
import { displayName, requireWebSession } from "@/lib/session";
import { formatDateTime, formatMoney } from "@/lib/utils";

const tiles = [
  {
    href: "/dashboard/schedule",
    label: "Schedule",
    description: "Jobs and appointments",
    icon: CalendarDays,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    description: "Track every visit",
    icon: Briefcase,
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/dashboard/properties",
    label: "Job addresses",
    description: "Properties you visit",
    icon: MapPin,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Job updates & alerts",
    icon: BellRing,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    href: "/dashboard/reports",
    label: "Timeline",
    description: "Certificate history",
    icon: History,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    href: "/docs",
    label: "Help",
    description: "Guides & Flutter API",
    icon: Sparkles,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    href: "/dashboard/invoices",
    label: "Invoice",
    description: "Quotes & payments",
    icon: ReceiptText,
    tone: "bg-brand-50 text-brand-700",
  },
  {
    href: "/dashboard/backup",
    label: "Backup / Restore",
    description: "Keep data safe",
    icon: Cloud,
    tone: "bg-slate-100 text-slate-700",
  },
  {
    href: "/dashboard/contacts",
    label: "Contacts",
    description: "Clients & landlords",
    icon: Contact,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    href: "/dashboard/reminders",
    label: "Reminders",
    description: "Things to follow up",
    icon: BellRing,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    href: "/dashboard/gas-rate",
    label: "Gas Rate",
    description: "Metric & imperial",
    icon: Gauge,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/dashboard/tools",
    label: "Tools & manuals",
    description: "Pipe sizing & more",
    icon: Wrench,
    tone: "bg-cyan-50 text-cyan-700",
  },
];

export default async function DashboardHomePage() {
  const session = await requireWebSession();
  const { admin, user, account } = session;
  if (!account) return null;

  if (!account.subscription_active) {
    return <UpgradeNotice trialEnded />;
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const overdueCutoff = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [invoices, quotes, reportsThisMonth, overdueReports, appointmentsToday, upcoming, reminders, contacts] =
    await Promise.all([
      admin.from("documents").select("*").eq("user_id", user.id).eq("type", "invoice").order("created_at", { ascending: false }),
      admin.from("documents").select("status").eq("user_id", user.id).eq("type", "quote"),
      admin
        .from("gas_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth),
      admin
        .from("gas_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["draft", "in_progress"])
        .lt("created_at", overdueCutoff),
      admin
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("starts_at", startOfDay.toISOString())
        .lt("starts_at", endOfDay.toISOString()),
      admin
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .gte("starts_at", now.toISOString())
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(4),
      admin
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(4),
      admin.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

  const invoiceRows = invoices.data || [];
  const outstanding = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
  const overdueInvoices = invoiceRows.filter((invoice) => invoice.status === "overdue").length;
  const quotesAwaiting = (quotes.data || []).filter((quote) => ["draft", "sent"].includes(quote.status)).length;
  const currency = (account.settings?.currency as string) || "GBP";
  const name = displayName(session).split(" ")[0];

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <PageHeader
        eyebrow={greeting}
        title={`${name}'s workspace`}
        description="Your day at a glance - certificates, money and the next job."
        action={
          <Link href="/dashboard/reports/new" className="btn-primary">
            <FileBadge2 className="h-4 w-4" /> New certificate
          </Link>
        }
      />

      {(overdueInvoices > 0 || (overdueReports.count || 0) > 0) && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>{overdueInvoices}</strong> overdue invoice{overdueInvoices === 1 ? "" : "s"} and{" "}
              <strong>{overdueReports.count || 0}</strong> gas report
              {(overdueReports.count || 0) === 1 ? "" : "s"} need attention.
            </p>
          </div>
          <Link href="/dashboard/reminders" className="btn-secondary py-1.5 text-xs">
            Review reminders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatMoney(outstanding, currency)} hint={`${invoiceRows.length} invoices`} icon={Banknote} tone="amber" />
        <StatCard label="Quotes awaiting" value={quotesAwaiting} hint="Draft or sent" icon={FileText} tone="blue" />
        <StatCard label="Certificates this month" value={reportsThisMonth.count || 0} hint="Domestic & commercial" icon={FileBadge2} />
        <StatCard label="Jobs today" value={appointmentsToday.count || 0} hint={`${contacts.count || 0} contacts`} icon={CalendarDays} tone="slate" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/reports/new" className="text-xs font-bold text-brand-700 hover:text-brand-800">
                Create new report
              </Link>
            }
          >
            Quick access
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="card group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile.tone}`}>
                  <tile.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{tile.label}</p>
                  <p className="text-[11px] text-slate-500">{tile.description}</p>
                </div>
                <ArrowUpRight className="mt-auto h-4 w-4 self-end text-slate-300 transition group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section>
            <SectionTitle
              action={
                <Link href="/dashboard/schedule" className="text-xs font-bold text-brand-700">
                  View all
                </Link>
              }
            >
              Next up
            </SectionTitle>
            <div className="card divide-y divide-slate-100">
              {(upcoming.data || []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No upcoming jobs. Enjoy the quiet.</p>
              )}
              {(upcoming.data || []).map((appointment) => (
                <div key={appointment.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{appointment.title}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(appointment.starts_at)}</p>
                    {appointment.location && <p className="truncate text-xs text-slate-400">{appointment.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle
              action={
                <Link href="/dashboard/invoices" className="text-xs font-bold text-brand-700">
                  Invoices
                </Link>
              }
            >
              Latest invoices
            </SectionTitle>
            <div className="card divide-y divide-slate-100">
              {invoiceRows.slice(0, 4).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{invoice.client_name}</p>
                    <p className="text-xs text-slate-500">
                      {invoice.number} · {formatDateTime(invoice.issue_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatMoney(invoice.total, currency)}</p>
                    <Badge status={invoice.status} />
                  </div>
                </Link>
              ))}
              {invoiceRows.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</p>
              )}
            </div>
          </section>

          <section>
            <SectionTitle
              action={
                <Link href="/dashboard/reminders" className="text-xs font-bold text-brand-700">
                  Reminders
                </Link>
              }
            >
              Reminders
            </SectionTitle>
            <div className="card divide-y divide-slate-100">
              {(reminders.data || []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing pending.</p>
              )}
              {(reminders.data || []).map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{reminder.title}</p>
                    <p className="text-xs text-slate-500">{reminder.due_date || "No due date"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
