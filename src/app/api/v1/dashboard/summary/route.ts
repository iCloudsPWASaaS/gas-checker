import {
  handleRoute,
  ok,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { markOverdueInvoices } from "@/lib/documents";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const admin = ctx.admin;
    const userId = ctx.user.id;

    await markOverdueInvoices(admin, userId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const overdueReportCutoff = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [
      contacts,
      invoices,
      quotes,
      reportsThisMonth,
      reportsOverdue,
      reminders,
      appointmentsToday,
      upcomingAppointments,
      recentInvoices,
      pendingReminders,
    ] = await Promise.all([
      admin.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      admin
        .from("documents")
        .select("status,total,amount_paid,balance")
        .eq("user_id", userId)
        .eq("type", "invoice"),
      admin.from("documents").select("status", { count: "exact" }).eq("user_id", userId).eq("type", "quote"),
      admin
        .from("gas_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth),
      admin
        .from("gas_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["draft", "in_progress"])
        .lt("created_at", overdueReportCutoff),
      admin
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending"),
      admin
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("starts_at", startOfDay.toISOString())
        .lt("starts_at", endOfDay.toISOString()),
      admin
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .gte("starts_at", now.toISOString())
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(5),
      admin
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "invoice")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5),
    ]);

    const invoiceRows = invoices.data || [];
    const outstanding = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
    const totalInvoiced = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const totalPaid = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
    const overdueInvoices = invoiceRows.filter((invoice) => invoice.status === "overdue").length;

    return ok({
      counts: {
        contacts: contacts.count || 0,
        invoices: invoiceRows.length,
        quotes: quotes.count || 0,
        reports_this_month: reportsThisMonth.count || 0,
        overdue_gas_reports: reportsOverdue.count || 0,
        overdue_invoices: overdueInvoices,
        pending_reminders: reminders.count || 0,
        appointments_today: appointmentsToday.count || 0,
      },
      money: {
        total_invoiced: Number(totalInvoiced.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding: Number(outstanding.toFixed(2)),
        currency: (account.settings?.currency as string) || "GBP",
      },
      recent_invoices: recentInvoices.data || [],
      upcoming_appointments: upcomingAppointments.data || [],
      pending_reminders: pendingReminders.data || [],
      subscription: {
        status: account.subscription?.status || null,
        active: account.subscription_active,
        trialing: account.is_trialing,
        trial_days_left: account.trial_days_left,
        plan: account.plan?.name || null,
      },
    });
  });
}
