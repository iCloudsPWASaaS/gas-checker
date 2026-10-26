"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Flame,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: Layers },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/orders", label: "Orders & invoices", icon: ReceiptText },
  { href: "/admin/payments", label: "Payments", icon: Banknote },
  { href: "/admin/settings", label: "Platform settings", icon: Settings },
  { href: "/admin/activity", label: "Audit log", icon: ScrollText },
];

export function AdminShell({
  children,
  name,
  email,
}: {
  children: React.ReactNode;
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Flame className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-sm font-extrabold tracking-tight text-white">
              Gas<span className="text-brand-400">Checker</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <ShieldCheck className="h-3 w-3" /> Admin
            </span>
          </span>
        </Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close admin menu">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              isActive(item.href, item.exact)
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
            {isActive(item.href, item.exact) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to app
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold uppercase text-white">
            {name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{name}</p>
            <p className="truncate text-[10px] text-slate-500">{email}</p>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open admin menu">
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-bold text-slate-900">Admin console</span>
          </div>
          <span className="badge ml-auto bg-amber-100 text-amber-800">Super admin</span>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
