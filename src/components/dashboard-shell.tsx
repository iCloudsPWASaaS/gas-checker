"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Banknote,
  Bell,
  BellRing,
  Briefcase,
  CalendarDays,
  Cloud,
  Code2,
  Contact,
  CreditCard,
  FileBadge2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/properties", label: "Job addresses", icon: MapPin },
  { href: "/dashboard/reports", label: "Certificates", icon: FileBadge2 },
  { href: "/dashboard/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
  { href: "/dashboard/contacts", label: "Contacts", icon: Contact },
  { href: "/dashboard/reminders", label: "Reminders", icon: BellRing },
  { href: "/dashboard/tools", label: "Tools & manuals", icon: Wrench },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/backup", label: "Backup / Restore", icon: Cloud },
];

const secondary = [
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/docs", label: "Flutter API", icon: Code2 },
];

export function DashboardShell({
  children,
  name,
  email,
  company,
  planName,
  trialDaysLeft,
  active,
  isTrialing,
  announcement,
  isAdmin,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
  company: string;
  planName: string;
  trialDaysLeft: number;
  active: boolean;
  isTrialing: boolean;
  announcement?: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const secondaryNav = isAdmin
    ? [{ href: "/admin", label: "Admin console", icon: ShieldCheck }, ...secondary]
    : secondary;

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="px-3">
        <div
          className={cn(
            "rounded-2xl border p-3",
            active ? "border-brand-200 bg-brand-50/70" : "border-amber-200 bg-amber-50",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              {planName}
            </span>
            <Link href="/dashboard/billing" className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
              Manage
            </Link>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {isTrialing
              ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`
              : active
                ? "Subscription active"
                : "Trial ended - choose a plan to continue"}
          </p>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn("nav-link", isActive(item.href, item.exact) && "nav-link-active")}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        ))}
        <div className="my-3 border-t border-slate-100" />
        {secondaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn("nav-link", isActive(item.href) && "nav-link-active")}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
            {item.href === "/docs" && <ArrowUpRight className="ml-auto h-3.5 w-3.5" />}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold uppercase text-white">
            {name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="truncate text-[11px] text-slate-500">{company}</p>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <p className="truncate px-2 text-[10px] text-slate-400">{email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-float">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <Logo compact />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <span
              className={cn(
                "badge",
                active ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-800",
              )}
            >
              {isTrialing ? `${trialDaysLeft}d trial` : active ? "Active" : "Expired"}
            </span>
          </div>
        </header>

        {isTrialing && (
          <div className="border-b border-brand-100 bg-brand-50/70 px-4 py-2 text-center text-xs font-semibold text-brand-800 sm:px-6">
            Your free trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}.{" "}
            <Link href="/dashboard/billing" className="underline underline-offset-2">
              Choose a plan
            </Link>
          </div>
        )}
        {!active && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800 sm:px-6">
            Your trial has ended.{" "}
            <Link href="/dashboard/billing" className="underline underline-offset-2">
              Subscribe to continue
            </Link>
          </div>
        )}
        {announcement && (
          <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 text-center text-xs font-semibold text-white sm:px-6">
            {announcement}
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function SetupRequired({ message }: { message: string }) {
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card max-w-2xl p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Banknote className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">One quick setup step</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <ol className="mt-5 space-y-3 text-sm text-slate-600">
          <li>
            1. Open your Supabase project, then <strong>SQL Editor</strong>.
          </li>
          <li>
            2. Run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">supabase/migrations/0001_init.sql</code>,{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">0002_admin.sql</code> then{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">0003_jobs_tools_notifications.sql</code>.
          </li>
          <li>
            3. Go to <strong>Project Settings → API → Exposed schemas</strong> and add{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">gas-checker</code>.
          </li>
          <li>
            4. Confirm the storage bucket <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">gas-checker</code>{" "}
            exists, then refresh this page.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          {projectRef && (
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Open SQL editor <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          <Link href="/docs" className="btn-secondary">
            API documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
